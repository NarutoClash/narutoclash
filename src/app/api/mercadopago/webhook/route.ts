import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configurar Supabase (Service Role para API Routes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    
    // Se você não tem o secret configurado, pular validação (NÃO RECOMENDADO EM PRODUÇÃO)
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
  try {
    const body = await request.json();
    
    console.log('🔔 Webhook recebido do Mercado Pago:', JSON.stringify(body, null, 2));

    // ✅ Validar assinatura (segurança)
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    if (body.data?.id) {
      const isValid = validateMercadoPagoSignature(xSignature, xRequestId, body.data.id);
      
      if (!isValid && process.env.NODE_ENV === 'production') {
        console.error('❌ Assinatura inválida - requisição rejeitada');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // O Mercado Pago envia diferentes tipos de notificações
    const { type, data } = body;

    // Só processar notificações de pagamento
    if (type !== 'payment') {
      console.log('ℹ️ Tipo de notificação ignorado:', type);
      return NextResponse.json({ received: true });
    }

    // ID do pagamento no Mercado Pago
    const paymentId = data?.id;

    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no webhook');
      return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 });
    }

    console.log('💳 Processando pagamento:', paymentId);

    // Buscar informações do pagamento usando a API do Mercado Pago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('❌ Erro ao buscar dados do pagamento no Mercado Pago');
      const errorText = await paymentResponse.text();
      console.error('Resposta da API:', errorText);
      return NextResponse.json({ error: 'Erro ao consultar pagamento' }, { status: 500 });
    }

    const paymentData = await paymentResponse.json();
    
    console.log('📊 Dados do pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount,
      date_approved: paymentData.date_approved,
    });

    const status = paymentData.status;
    const externalReference = paymentData.external_reference; // ID do nosso registro
    const paymentMethod = paymentData.payment_method_id;

    // ✅ Verificar se o external_reference existe
    if (!externalReference) {
      console.error('❌ external_reference não encontrado no pagamento');
      return NextResponse.json({ error: 'External reference não encontrado' }, { status: 400 });
    }

    // Atualizar registro no banco
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
      console.error('❌ Erro ao atualizar pagamento no banco:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
    }

    console.log('✅ Pagamento atualizado no banco');

    // Se o pagamento foi aprovado, creditar CP
    if (status === 'approved') {
      console.log('💰 Pagamento aprovado! Creditando CP...');

      // ✅ Verificar se já foi processado (evitar duplicação)
      const { data: existingPayment, error: checkError } = await supabase
        .from('pagamentos_mercadopago')
        .select('status, user_id, quantidade_cp')
        .eq('payment_id', paymentId.toString())
        .single();

      if (checkError) {
        console.error('❌ Erro ao verificar pagamento:', checkError);
      }

      if (existingPayment && existingPayment.status === 'credited') {
        console.log('⚠️ Pagamento já foi creditado anteriormente - pulando');
        return NextResponse.json({ received: true, status: 'already_credited' });
      }

      // Chamar a função SQL que criamos
      const { error: creditError } = await supabase.rpc('processar_pagamento_aprovado', {
        p_payment_id: paymentId.toString(),
      });

      if (creditError) {
        console.error('❌ Erro ao creditar CP:', creditError);
        return NextResponse.json({ error: 'Erro ao creditar CP', details: creditError }, { status: 500 });
      }

      // ✅ Marcar como creditado
      await supabase
        .from('pagamentos_mercadopago')
        .update({ status: 'credited' })
        .eq('payment_id', paymentId.toString());

      console.log('✅ CP creditado com sucesso!');
    } else if (status === 'rejected') {
      console.log(`❌ Pagamento rejeitado: ${paymentData.status_detail}`);
    } else if (status === 'pending') {
      console.log(`⏳ Pagamento pendente: ${paymentData.status_detail}`);
    } else {
      console.log(`ℹ️ Pagamento com status: ${status} (não creditado)`);
    }

    return NextResponse.json({ received: true, status });

  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET para teste (opcional)
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook do Mercado Pago funcionando!',
    timestamp: new Date().toISOString(),
    config: {
      has_webhook_secret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
      has_access_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    }
  });
}
