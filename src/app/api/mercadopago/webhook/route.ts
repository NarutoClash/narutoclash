import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurar Supabase (Service Role para API Routes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 Webhook recebido do Mercado Pago:', JSON.stringify(body, null, 2));

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
      return NextResponse.json({ error: 'Erro ao consultar pagamento' }, { status: 500 });
    }

    const paymentData = await paymentResponse.json();
    
    console.log('📊 Dados do pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
    });

    const status = paymentData.status;
    const externalReference = paymentData.external_reference; // ID do nosso registro
    const paymentMethod = paymentData.payment_method_id;

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

      // Chamar a função SQL que criamos
      const { error: creditError } = await supabase.rpc('processar_pagamento_aprovado', {
        p_payment_id: paymentId.toString(),
      });

      if (creditError) {
        console.error('❌ Erro ao creditar CP:', creditError);
        return NextResponse.json({ error: 'Erro ao creditar CP' }, { status: 500 });
      }

      console.log('✅ CP creditado com sucesso!');
    } else {
      console.log(`ℹ️ Pagamento com status: ${status} (não creditado)`);
    }

    return NextResponse.json({ received: true, status });

  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: error.message,
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
  });
}