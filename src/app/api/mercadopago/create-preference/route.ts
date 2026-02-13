import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configurar Supabase (Service Role para API Routes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// ✅ Validar assinatura do Mercado Pago
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
    
    // Se você não tem o secret configurado, pular validação
    if (!secret) {
      console.warn('⚠️ MERCADOPAGO_WEBHOOK_SECRET não configurado - pulando validação');
      return true;
    }

    // Extrair hash da assinatura
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

    // Gerar hash esperado
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
  console.log('🔔 ===== WEBHOOK INICIADO =====');
  
  try {
    // 1️⃣ Ler o body
    let body;
    try {
      body = await request.json();
      console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 2️⃣ Validar estrutura básica
    if (!body || !body.type || !body.data) {
      console.error('❌ Body inválido - faltam campos obrigatórios');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3️⃣ Validar assinatura
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    console.log('🔐 Headers de segurança:', {
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId,
    });

    if (body.data?.id) {
      const isValid = validateMercadoPagoSignature(xSignature, xRequestId, body.data.id);
      
      if (!isValid && process.env.NODE_ENV === 'production') {
        console.error('❌ Assinatura inválida - requisição rejeitada');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 4️⃣ Verificar tipo de notificação
    const { type, action, data } = body;

    console.log('📋 Tipo de notificação:', { type, action });

    // Só processar notificações de pagamento
    if (type !== 'payment') {
      console.log('ℹ️ Tipo de notificação ignorado:', type);
      return NextResponse.json({ received: true, ignored: type });
    }

    // 5️⃣ Extrair ID do pagamento
    const paymentId = data?.id;

    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no webhook');
      return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 });
    }

    console.log('💳 Processando pagamento:', paymentId);

    // 6️⃣ Buscar informações do pagamento na API do Mercado Pago
    let paymentData;
    try {
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
        return NextResponse.json({ error: 'Erro ao consultar pagamento' }, { status: 500 });
      }

      paymentData = await paymentResponse.json();
      
      console.log('📊 Dados do pagamento recebidos:', {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        external_reference: paymentData.external_reference,
        transaction_amount: paymentData.transaction_amount,
      });
    } catch (fetchError) {
      console.error('❌ Erro ao fazer fetch do pagamento:', fetchError);
      return NextResponse.json({ error: 'Erro de rede ao consultar MP' }, { status: 500 });
    }

    // 7️⃣ Extrair dados importantes
    const status = paymentData.status;
    const externalReference = paymentData.external_reference;
    const paymentMethod = paymentData.payment_method_id;

    if (!externalReference) {
      console.error('❌ external_reference não encontrado no pagamento');
      return NextResponse.json({ error: 'External reference ausente' }, { status: 400 });
    }

    console.log('🔗 External Reference:', externalReference);

    // 8️⃣ Atualizar registro no banco
    try {
      const { error: updateError } = await supabase
        .from('pagamentos_mercadopago')
        .update({
          payment_id: paymentId.toString(),
          status: status,
          metodo_pagamento: paymentMethod,
          dados_pagamento: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', externalReference);

      if (updateError) {
        console.error('❌ Erro ao atualizar no Supabase:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao atualizar registro',
          details: updateError.message,
        }, { status: 500 });
      }

      console.log('✅ Pagamento atualizado no banco');
    } catch (dbError) {
      console.error('❌ Erro de banco de dados:', dbError);
      return NextResponse.json({ error: 'Erro de banco de dados' }, { status: 500 });
    }

    // 9️⃣ Se aprovado, creditar CP
    if (status === 'approved') {
      console.log('💰 Pagamento aprovado! Iniciando crédito de CP...');

      try {
        // Verificar se já foi processado
        const { data: existingPayment, error: checkError } = await supabase
          .from('pagamentos_mercadopago')
          .select('status, user_id, quantidade_cp')
          .eq('payment_id', paymentId.toString())
          .single();

        if (checkError) {
          console.error('❌ Erro ao verificar status:', checkError);
        }

        if (existingPayment?.status === 'credited') {
          console.log('⚠️ Pagamento já creditado - pulando');
          return NextResponse.json({ 
            received: true, 
            status: 'already_credited',
          });
        }

        // Chamar função SQL para creditar
        const { error: creditError } = await supabase.rpc('processar_pagamento_aprovado', {
          p_payment_id: paymentId.toString(),
        });

        if (creditError) {
          console.error('❌ Erro ao creditar CP:', creditError);
          return NextResponse.json({ 
            error: 'Erro ao creditar CP',
            details: creditError.message,
          }, { status: 500 });
        }

        // Marcar como creditado
        await supabase
          .from('pagamentos_mercadopago')
          .update({ status: 'credited' })
          .eq('payment_id', paymentId.toString());

        console.log('✅ CP creditado com sucesso!');
        
      } catch (creditProcessError) {
        console.error('❌ Erro no processo de crédito:', creditProcessError);
        return NextResponse.json({ 
          error: 'Erro ao processar crédito',
        }, { status: 500 });
      }
    } else if (status === 'rejected') {
      console.log(`❌ Pagamento rejeitado: ${paymentData.status_detail}`);
    } else if (status === 'pending') {
      console.log(`⏳ Pagamento pendente: ${paymentData.status_detail}`);
    } else {
      console.log(`ℹ️ Pagamento com status: ${status}`);
    }

    console.log('🔔 ===== WEBHOOK FINALIZADO COM SUCESSO =====');
    
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
    message: 'Webhook do Mercado Pago - v2.0 (Corrigido)',
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