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
    const { userId, pacoteId } = body;

    console.log('📦 Dados recebidos:', { userId, pacoteId });

    // 2️⃣ Validar dados obrigatórios
    if (!userId || !pacoteId) {
      console.error('❌ Dados incompletos');
      return NextResponse.json(
        { error: 'userId e pacoteId são obrigatórios' },
        { status: 400 }
      );
    }

    // 3️⃣ Verificar variáveis de ambiente
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

    // 4️⃣ Buscar dados do pacote
    const { data: pacote, error: pacoteError } = await supabase
      .from('pacotes_cp')
      .select('*')
      .eq('id', pacoteId)
      .eq('ativo', true)
      .single();

    if (pacoteError || !pacote) {
      console.error('❌ Pacote não encontrado:', pacoteError);
      return NextResponse.json(
        { error: 'Pacote não encontrado ou inativo' },
        { status: 404 }
      );
    }

    console.log('📦 Pacote encontrado:', pacote.nome, '-', pacote.quantidade_cp, 'CP');

    // 5️⃣ Buscar email do usuário (da tabela auth.users)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      console.error('❌ Erro ao buscar usuário:', authError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userEmail = authUser.user.email;
    const userName = authUser.user.user_metadata?.name || 'Jogador';

    console.log('👤 Usuário encontrado:', userEmail);

    // 6️⃣ Buscar dados do profile (para pegar o nome do personagem)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const characterName = profile?.name || userName;

    // 7️⃣ Criar registro inicial no banco (status: pending)
    const { data: pagamento, error: insertError } = await supabase
      .from('pagamentos_mercadopago')
      .insert({
        user_id: userId,
        pacote_id: pacoteId,
        pacote_nome: pacote.nome,
        quantidade_cp: pacote.quantidade_cp + (pacote.bonus_cp || 0),
        valor_brl: parseFloat(pacote.preco_brl),
        status: 'pending',
        cp_creditado: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

    // 8️⃣ Criar preferência de pagamento no Mercado Pago
    const cpTotal = pacote.quantidade_cp + (pacote.bonus_cp || 0);
    const bonusText = pacote.bonus_cp > 0 ? ` +${pacote.bonus_cp} BÔNUS` : '';
    
    const preference = {
      items: [
        {
          title: `${pacote.nome} - ${cpTotal} CP${bonusText}`,
          quantity: 1,
          unit_price: parseFloat(pacote.preco_brl),
          currency_id: 'BRL',
          description: pacote.descricao || `Pacote de ${cpTotal} Clash Points`,
        },
      ],
      payer: {
        email: userEmail,
        name: characterName,
      },
      external_reference: pagamento.id.toString(), // ⚠️ IMPORTANTE: ID do banco
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
        pacote_id: pacoteId,
        quantidade_cp: cpTotal,
        character_name: characterName,
      },
    };

    console.log('📤 Enviando preferência para o Mercado Pago...');
    console.log('External Reference:', pagamento.id);

    // 9️⃣ Fazer requisição para API do Mercado Pago
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

    // 🔟 Atualizar registro com preference_id
    const { error: updateError } = await supabase
      .from('pagamentos_mercadopago')
      .update({
        preference_id: mpData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pagamento.id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar preference_id:', updateError);
    }

    console.log('✅ ===== PREFERÊNCIA CRIADA COM SUCESSO =====');

    // 1️⃣1️⃣ Retornar link de pagamento
    return NextResponse.json({
      success: true,
      payment_id: pagamento.id,
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      pacote: {
        nome: pacote.nome,
        quantidade_cp: cpTotal,
        valor: parseFloat(pacote.preco_brl),
      },
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