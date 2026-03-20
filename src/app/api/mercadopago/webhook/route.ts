// src/app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Validar assinatura do Mercado Pago
function validateMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  if (!xSignature || !xRequestId) {
    console.warn('⚠️ Headers de assinatura ausentes');
    return false;
  }

  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('❌ MERCADOPAGO_WEBHOOK_SECRET não configurado — rejeitando webhook por segurança');
      return false;
    }

    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === 'ts') ts = trimmedValue;
        if (trimmedKey === 'v1') hash = trimmedValue;
      }
    }

    if (!ts || !hash) {
      console.error('❌ Assinatura malformada');
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');

    const isValid = hash === expectedHash;
    
    if (!isValid) {
      console.error('❌ Assinatura inválida:', { hash, expectedHash });
    }

    return isValid;
  } catch (error) {
    console.error('❌ Erro ao validar assinatura:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  
  try {
    // 1️⃣ Ler o body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body) {
      console.error('❌ Body vazio');
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    // 2️⃣ Extrair tipo e ID (múltiplos formatos do MP)
    const type = body.type || body.topic || body.action;
    let dataId = body.data?.id || body.resource || body.id;
    
    
    if (!type) {
      return NextResponse.json({ received: true, warning: 'Unknown type' });
    }
    
    if (!dataId) {
      return NextResponse.json({ received: true, warning: 'No ID' });
    }

    // 3️⃣ Validar assinatura
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    if (dataId) {
      const isValid = validateMercadoPagoSignature(xSignature, xRequestId, String(dataId));
      
      if (!isValid && process.env.NODE_ENV === 'production') {
        console.error('❌ Assinatura inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 4️⃣ Só processar notificações de pagamento
    if (type !== 'payment') {
      return NextResponse.json({ received: true, ignored: type });
    }

    const paymentId = dataId;

    // 5️⃣ Buscar dados do pagamento no Mercado Pago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('❌ Erro ao buscar pagamento no MP:', {
        status: paymentResponse.status,
        error: errorText,
      });
      return NextResponse.json({ error: 'Erro ao consultar MP' }, { status: 500 });
    }

    const paymentData = await paymentResponse.json();
    

    const status = paymentData.status;
    const externalReference = paymentData.external_reference;
    const paymentMethod = paymentData.payment_method_id;

    if (!externalReference) {
      console.error('❌ external_reference não encontrado');
      return NextResponse.json({ error: 'External reference ausente' }, { status: 400 });
    }


    // 6️⃣ Atualizar método de pagamento (informativo, sem impacto em idempotência)
    await supabase
      .from('payment_transactions')
      .update({
        webhook_received_at: new Date().toISOString(),
      })
      .eq('id', externalReference)
      .neq('status', 'completed'); // não sobrescrever se já completado


    // 7️⃣ Se aprovado, creditar CP
    if (status === 'approved') {

      // ── Proteção atômica contra duplo crédito ────────────────────────
      // UPDATE só executa se status ainda não for 'completed'.
      // Se dois webhooks chegarem ao mesmo tempo, apenas um vai encontrar
      // status != 'completed' e prosseguir — o outro recebe 0 linhas afetadas.
      const { data: claimedRows, error: claimError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          external_payment_id: paymentId.toString(),
          payment_method: paymentMethod,
        })
        .eq('id', externalReference)
        .neq('status', 'completed')
        .select('user_id, cp_amount, bonus_cp');

      if (claimError) {
        console.error('❌ Erro ao tentar reservar pagamento:', claimError);
        return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
      }

      // Nenhuma linha afetada = já foi creditado por outro webhook
      if (!claimedRows || claimedRows.length === 0) {
        return NextResponse.json({ received: true, status: 'already_credited' });
      }

      const pagamento = claimedRows[0];
      const totalCP = pagamento.cp_amount + (pagamento.bonus_cp || 0);

      // Creditar CP no profile via RPC
      const { error: creditError } = await supabase.rpc('increment_clash_points', {
        user_id: pagamento.user_id,
        amount: totalCP,
      });

      // Fallback: se a RPC não existir, fazer update direto
      if (creditError) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('clash_points')
          .eq('id', pagamento.user_id)
          .single();

        const { error: directCreditError } = await supabase
          .from('profiles')
          .update({
            clash_points: (currentProfile?.clash_points || 0) + totalCP,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pagamento.user_id);

        if (directCreditError) {
          console.error('❌ Erro ao creditar CP:', directCreditError);
          return NextResponse.json({ 
            error: 'Erro ao creditar CP',
            details: directCreditError.message,
          }, { status: 500 });
        }
      }

      // Registrar na tabela de transações
      await supabase
        .from('cp_transactions')
        .insert({
          user_id: pagamento.user_id,
          amount: totalCP,
          type: 'purchase',
          description: `Compra via Mercado Pago - Pagamento #${paymentId}`,
          created_at: new Date().toISOString(),
        });
    }

    
    return NextResponse.json({ 
      received: true, 
      status,
      payment_id: paymentId,
    });

  } catch (error: any) {
    console.error('❌ ===== ERRO CRÍTICO NO WEBHOOK =====');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET para teste
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook do Mercado Pago - Naruto Clash',
    status: 'online',
    timestamp: new Date().toISOString(),
    config: {
      has_webhook_secret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
      has_access_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  });
}