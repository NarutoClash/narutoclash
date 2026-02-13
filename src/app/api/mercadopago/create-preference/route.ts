// src/app/api/mercadopago/create-preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function POST(request: NextRequest) {
  console.log('💳 ===== CRIANDO PREFERÊNCIA DE PAGAMENTO =====');
  
  try {
    // 1️⃣ Ler dados da requisição
    const body = await request.json();
    const { userId, quantidade_cp, valor, descricao } = body;

    console.log('📦 Dados recebidos:', { userId, quantidade_cp, valor, descricao });

    // 2️⃣ Validar dados obrigatórios
    if (!userId || !quantidade_cp || !valor) {
      console.error('❌ Dados incompletos');
      return NextResponse.json(
        { error: 'Dados incompletos: userId, quantidade_cp e valor são obrigatórios' },
        { status: 400 }
      );
    }

    // 3️⃣ Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Mercado Pago não configurado no servidor' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('❌ NEXT_PUBLIC_APP_URL não configurado');
      return NextResponse.json(
        { error: 'URL do app não configurada' },
        { status: 500 }
      );
    }

    // 4️⃣ Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, nome_completo, username')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ Erro ao buscar usuário:', userError);
      
      // Tentar buscar direto da tabela auth.users se profiles não funcionar
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      
      if (!authUser) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      console.log('✅ Usuário encontrado via auth:', authUser.user.email);
      userData.email = authUser.user.email;
      userData.nome_completo = authUser.user.user_metadata?.full_name || 'Usuário';
    }

    console.log('👤 Usuário encontrado:', userData.email);

    // 5️⃣ Criar registro inicial no banco (status: pending)
    const { data: pagamento, error: insertError } = await supabase
      .from('pagamentos_mercadopago')
      .insert({
        user_id: userId,
        quantidade_cp: quantidade_cp,
        valor: parseFloat(valor),
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !pagamento) {
      console.error('❌ Erro ao criar registro:', insertError);
      return NextResponse.json(
        { 
          error: 'Erro ao criar registro de pagamento',
          details: insertError?.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Registro criado no banco com ID:', pagamento.id);

    // 6️⃣ Criar preferência de pagamento no Mercado Pago
    const preference = {
      items: [
        {
          title: descricao || `${quantidade_cp} CP - Naruto Clash`,
          quantity: 1,
          unit_price: parseFloat(valor),
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: userData.email,
        name: userData.nome_completo || userData.username || 'Usuário',
      },
      external_reference: pagamento.id, // ⚠️ IMPORTANTE: ID do nosso banco
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/loja?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/loja?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/loja?status=pending`,
      },
      auto_return: 'approved',
      statement_descriptor: 'NARUTO CLASH',
      metadata: {
        user_id: userId,
        quantidade_cp: quantidade_cp,
      },
    };

    console.log('📤 Enviando preferência para o Mercado Pago...');
    console.log('External Reference:', pagamento.id);
    console.log('Notification URL:', preference.notification_url);

    // 7️⃣ Fazer requisição para API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('❌ Erro na API do Mercado Pago:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        error: errorText,
      });
      
      // Deletar registro criado se falhou
      await supabase
        .from('pagamentos_mercadopago')
        .delete()
        .eq('id', pagamento.id);

      return NextResponse.json(
        { 
          error: 'Erro ao criar preferência no Mercado Pago', 
          details: errorText,
          status: mpResponse.status,
        },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();
    console.log('✅ Preferência criada com sucesso!');
    console.log('Preference ID:', mpData.id);
    console.log('Init Point:', mpData.init_point);

    // 8️⃣ Atualizar registro com preference_id e links
    const { error: updateError } = await supabase
      .from('pagamentos_mercadopago')
      .update({
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      })
      .eq('id', pagamento.id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar preference_id (não crítico):', updateError);
    }

    console.log('✅ ===== PREFERÊNCIA CRIADA COM SUCESSO =====');

    // 9️⃣ Retornar link de pagamento
    return NextResponse.json({
      success: true,
      payment_id: pagamento.id,
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
    });

  } catch (error: any) {
    console.error('❌ ===== ERRO CRÍTICO AO CRIAR PREFERÊNCIA =====');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET para teste de configuração
export async function GET() {
  return NextResponse.json({ 
    message: 'API de criação de preferência - Mercado Pago',
    status: 'online',
    timestamp: new Date().toISOString(),
    config: {
      has_access_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      access_token_preview: process.env.MERCADOPAGO_ACCESS_TOKEN 
        ? `${process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 20)}...` 
        : 'NÃO CONFIGURADO',
      has_app_url: !!process.env.NEXT_PUBLIC_APP_URL,
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'NÃO CONFIGURADO',
      has_supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    }
  });
}