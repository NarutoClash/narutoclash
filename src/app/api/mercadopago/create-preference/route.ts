import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);

// Configurar Supabase (Service Role para API Routes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pacote_id, user_id } = body;

    console.log('📦 Criando preferência de pagamento:', { pacote_id, user_id });

    // 1️⃣ Validar dados
    if (!pacote_id || !user_id) {
      return NextResponse.json(
        { error: 'Dados inválidos', message: 'pacote_id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // 2️⃣ Buscar dados do pacote
    const { data: pacote, error: pacoteError } = await supabase
      .from('pacotes_cp')
      .select('*')
      .eq('id', pacote_id)
      .eq('ativo', true)
      .single();

    if (pacoteError || !pacote) {
      console.error('❌ Erro ao buscar pacote:', pacoteError);
      return NextResponse.json(
        { error: 'Pacote não encontrado', message: 'O pacote selecionado não existe ou está inativo' },
        { status: 404 }
      );
    }

    // 3️⃣ Buscar dados do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Erro ao buscar perfil:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado', message: 'Erro ao buscar dados do usuário' },
        { status: 404 }
      );
    }

    // Buscar email do auth
    let userEmail = `user_${user_id.substring(0, 8)}@narutoclash.com`;
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(user_id);
      if (authData?.user?.email) {
        userEmail = authData.user.email;
      }
    } catch (e) {
      console.log('⚠️ Não foi possível buscar email do auth, usando email padrão');
    }

    const userName = userProfile.name || 'Jogador';

    // 4️⃣ Calcular CP total (base + bônus)
    const totalCP = pacote.quantidade_cp + (pacote.bonus_cp || 0);

    // 5️⃣ Criar registro do pagamento no banco (status: pending)
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos_mercadopago')
      .insert({
        user_id: user_id,
        pacote_id: pacote.id,
        pacote_nome: pacote.nome,
        quantidade_cp: totalCP,
        valor_brl: pacote.preco_brl,
        status: 'pending',
      })
      .select()
      .single();

    if (pagamentoError || !pagamento) {
      console.error('❌ Erro ao criar registro de pagamento:', pagamentoError);
      return NextResponse.json(
        { error: 'Erro ao processar', message: 'Não foi possível criar o registro de pagamento' },
        { status: 500 }
      );
    }

    console.log('✅ Registro de pagamento criado:', pagamento.id);

    // 6️⃣ Criar preferência no Mercado Pago
    const preferenceData = {
      items: [
        {
          id: pacote.id.toString(),
          title: `${pacote.nome} - ${totalCP} CP`,
          description: pacote.descricao || `Pacote de ${totalCP} Clash Points`,
          quantity: 1,
          unit_price: Number(pacote.preco_brl),
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: userName,
        email: userEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/buy/success`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/buy/failure`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/buy/pending`,
      },
      auto_return: 'approved' as const,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
      external_reference: pagamento.id.toString(),
      statement_descriptor: 'NARUTO CLASH CP',
      metadata: {
        user_id: user_id,
        pacote_id: pacote.id,
        pagamento_id: pagamento.id,
        total_cp: totalCP,
      },
    };

    console.log('📤 Enviando preferência ao Mercado Pago...');

    const response = await preference.create({ body: preferenceData });

    console.log('✅ Preferência criada:', response.id);

    // 7️⃣ Atualizar registro com preference_id
    await supabase
      .from('pagamentos_mercadopago')
      .update({ preference_id: response.id })
      .eq('id', pagamento.id);

    // 8️⃣ Retornar link de pagamento
    return NextResponse.json({
      preference_id: response.id,
      init_point: response.sandbox_init_point || response.init_point, // Usar sandbox em teste
      pagamento_id: pagamento.id,
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar preferência:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: error.message || 'Erro ao processar pagamento',
        details: error.cause || error.stack,
      },
      { status: 500 }
    );
  }
}