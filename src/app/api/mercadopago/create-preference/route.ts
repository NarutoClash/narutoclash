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

    // 4️⃣ Buscar dados do PACOTE no banco
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

    console.log('📦 Pacote encontrado:', pacote.nome);

    // 5️⃣ Buscar dados do USUÁRIO no banco (profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado:', profileError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('👤 Usuário encontrado:', profile.name);

    // 6️⃣ Buscar EMAIL do usuário (auth.users)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    
    const userEmail = authUser?.user?.email || `${userId}@narutoclash.com`;
    const userName = profile.name || 'Jogador';

    console.log('📧 Email:', userEmail);

    // 7️⃣ Calcular CP total (base + bônus)
    const cpTotal = pacote.quantidade_cp + (pacote.bonus_cp || 0);

    // 8️⃣ Criar registro no banco (status: pending)
    const { data: pagamento, error: insertError } = await supabase
  .from('payment_transactions')
  .insert({
    user_id: userId,
    package_id: pacoteId, // ← mudou de pacote_id
    cp_amount: pacote.quantidade_cp, // ← só o base
    bonus_cp: pacote.bonus_cp || 0, // ← bônus separado
    price_paid: parseFloat(pacote.preco_brl), // ← mudou de valor_brl
    payment_method: 'pending', // ← vai ser atualizado depois
    payment_provider: 'mercadopago', // ← NOVO campo
    status: 'pending',
    created_at: new Date().toISOString(),
    // NÃO precisa de updated_at, cp_creditado, pacote_nome
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

    console.log('✅ Pagamento registrado no banco - ID:', pagamento.id);

    // 9️⃣ Criar preferência no Mercado Pago
    const bonusText = pacote.bonus_cp > 0 ? ` +${pacote.bonus_cp} BÔNUS` : '';
    
    const preference = {
      items: [
        {
          title: `${pacote.nome} - ${cpTotal} CP${bonusText}`,
          quantity: 1,
          unit_price: parseFloat(pacote.preco_brl),
          currency_id: 'BRL',
          description: `Pacote ${pacote.nome} - ${cpTotal} Clash Points`,
        },
      ],
      payer: {
        email: userEmail,
        name: userName,
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
        character_name: userName,
      },
    };

    console.log('📤 Criando preferência no Mercado Pago...');

    // 🔟 Chamar API do Mercado Pago
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
      console.error('❌ Erro do Mercado Pago:', errorText);
      
      // Deletar registro criado
      await supabase
  .from('payment_transactions')
  .delete()
  .eq('id', pagamento.id);

      return NextResponse.json(
        { 
          error: 'Erro ao criar preferência no Mercado Pago', 
          details: errorText,
        },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();
    console.log('✅ Preferência criada - ID:', mpData.id);

    // 1️⃣1️⃣ Atualizar registro com preference_id
    await supabase
  .from('payment_transactions')
  .update({
    external_payment_id: mpData.id, // ← mudou de preference_id
    payment_url: mpData.init_point, // ← NOVO: salvar link
  })
  .eq('id', pagamento.id);

    console.log('✅ ===== SUCESSO =====');

    // 1️⃣2️⃣ Retornar link de pagamento
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
    console.error('❌ ===== ERRO CRÍTICO =====');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// GET para teste
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