import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// ✅ VERIFICAR SE AS VARIÁVEIS DE AMBIENTE ESTÃO CONFIGURADAS
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ LOG DE VERIFICAÇÃO (só em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Verificando variáveis de ambiente:');
  console.log('🔑 MERCADOPAGO_ACCESS_TOKEN:', MERCADOPAGO_ACCESS_TOKEN ? '✅ Configurado' : '❌ FALTANDO');
  console.log('🌐 NEXT_PUBLIC_SITE_URL:', NEXT_PUBLIC_SITE_URL ? '✅ Configurado' : '❌ FALTANDO');
  console.log('🗄️ SUPABASE_URL:', SUPABASE_URL ? '✅ Configurado' : '❌ FALTANDO');
  console.log('🔐 SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Configurado' : '❌ FALTANDO');
}

// ✅ VALIDAR VARIÁVEIS OBRIGATÓRIAS
if (!MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado! Configure nas variáveis de ambiente.');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Variáveis do Supabase não configuradas!');
}

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);

// Configurar Supabase (Service Role para API Routes)
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ✅ Função para validar e formatar CPF
function validarCPF(cpf: string): string | null {
  const cpfNumeros = cpf.replace(/\D/g, '');
  
  if (cpfNumeros.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(cpfNumeros)) return null;
  
  return cpfNumeros;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pacote_id, user_id, device_session_id } = body;

    console.log('📦 Criando preferência de pagamento:', { 
      pacote_id, 
      user_id,
      device_session_id: device_session_id ? '✅ Presente' : '⚠️ Ausente'
    });

    // 1️⃣ Validar dados obrigatórios
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

    console.log('✅ Pacote encontrado:', pacote.nome);

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

    console.log('👤 Usuário:', userName, '-', userEmail);

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

    // 6️⃣ Validar e formatar CPF (OPCIONAL - não bloqueia o pagamento)
    let cpfFormatado = null;
    if (userProfile.cpf) {
      cpfFormatado = validarCPF(userProfile.cpf);
      if (!cpfFormatado) {
        console.warn('⚠️ CPF inválido no perfil, mas continuando sem CPF (é opcional)');
      } else {
        console.log('✅ CPF validado');
      }
    } else {
      console.log('ℹ️ Usuário sem CPF cadastrado (é opcional)');
    }

    // 7️⃣ Criar preferência no Mercado Pago
    const preferenceData: any = {
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
        // ✅ Só incluir CPF se for válido
        ...(cpfFormatado && {
          identification: {
            type: 'CPF',
            number: cpfFormatado,
          },
        }),
      },
      back_urls: {
        success: `${NEXT_PUBLIC_SITE_URL}/buy/success`,
        failure: `${NEXT_PUBLIC_SITE_URL}/buy/failure`,
        pending: `${NEXT_PUBLIC_SITE_URL}/buy/pending`,
      },
      auto_return: 'approved' as const,
      notification_url: `${NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
      external_reference: pagamento.id.toString(),
      statement_descriptor: 'NARUTO CLASH CP',
      metadata: {
        user_id: user_id,
        pacote_id: pacote.id,
        pagamento_id: pagamento.id,
        total_cp: totalCP,
        // ✅ Incluir Device Session ID nos metadados
        ...(device_session_id && { device_session_id }),
      },
      // ✅ Configurações de segurança anti-fraude
      binary_mode: true,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      // ✅ Device Session ID para análise de fraude (se disponível)
      ...(device_session_id && {
        additional_info: {
          device_id: device_session_id,
        },
      }),
    };

    console.log('📤 Enviando preferência ao Mercado Pago...');
    console.log('🔐 Device ID incluído:', !!device_session_id);

    // ✅ TENTAR CRIAR PREFERÊNCIA COM TRATAMENTO DE ERRO DETALHADO
    let response;
    try {
      response = await preference.create({ body: preferenceData });
      console.log('✅ Preferência criada:', response.id);
    } catch (mpError: any) {
      console.error('❌ Erro ao criar preferência no Mercado Pago:', mpError);
      console.error('📋 Detalhes do erro:', {
        message: mpError.message,
        cause: mpError.cause,
        status: mpError.status,
        response: mpError.response?.data,
      });

      return NextResponse.json(
        { 
          error: 'Erro ao criar preferência', 
          message: mpError.message || 'Erro ao comunicar com Mercado Pago',
          details: mpError.response?.data || mpError.cause,
        },
        { status: 500 }
      );
    }

    // 8️⃣ Atualizar registro com preference_id
    await supabase
      .from('pagamentos_mercadopago')
      .update({ preference_id: response.id })
      .eq('id', pagamento.id);

    console.log('✅ Preferência salva no banco');

    // 9️⃣ Retornar link de pagamento
    return NextResponse.json({
      preference_id: response.id,
      init_point: response.init_point,
      pagamento_id: pagamento.id,
    });

  } catch (error: any) {
    console.error('❌ Erro geral ao criar preferência:', error);
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

// ✅ ROTA GET para testar se a API está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API de criação de preferências está funcionando',
    timestamp: new Date().toISOString(),
    env_check: {
      mercadopago_token: !!MERCADOPAGO_ACCESS_TOKEN,
      site_url: !!NEXT_PUBLIC_SITE_URL,
      supabase: !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY,
    },
  });
}