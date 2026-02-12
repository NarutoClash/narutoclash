import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// ✅ Variáveis de ambiente
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MERCADOPAGO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Variáveis de ambiente obrigatórias não configuradas!');
}

const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const preference = new Preference(client);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ✅ Validar e formatar CPF
function validarCPF(cpf: string): string | null {
  const cpfNumeros = cpf.replace(/\D/g, '');
  if (cpfNumeros.length !== 11 || /^(\d)\1{10}$/.test(cpfNumeros)) return null;
  return cpfNumeros;
}

// ✅ Separar nome e sobrenome
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ');
  return {
    firstName: parts[0] || 'Jogador',
    lastName: parts.slice(1).join(' ') || 'Premium',
  };
}

// ✅ Formatar telefone
function formatPhone(phone: string | null): { area_code: string; number: string } | null {
  if (!phone) return null;
  const phoneNumbers = phone.replace(/\D/g, '');
  if (phoneNumbers.length < 10) return null;
  
  return {
    area_code: phoneNumbers.substring(0, 2),
    number: phoneNumbers.substring(2),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pacote_id, user_id, device_session_id } = body;

    console.log('📦 Criando preferência:', { pacote_id, user_id, device_id: !!device_session_id });

    // 1️⃣ Validar dados
    if (!pacote_id || !user_id) {
      return NextResponse.json(
        { error: 'Dados inválidos', message: 'pacote_id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // 2️⃣ Buscar pacote
    const { data: pacote, error: pacoteError } = await supabase
      .from('pacotes_cp')
      .select('*')
      .eq('id', pacote_id)
      .eq('ativo', true)
      .single();

    if (pacoteError || !pacote) {
      return NextResponse.json(
        { error: 'Pacote não encontrado' },
        { status: 404 }
      );
    }

    // 3️⃣ Buscar usuário
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
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
      console.log('⚠️ Email padrão será usado');
    }

    const userName = userProfile.name || 'Jogador Premium';
    const { firstName, lastName } = splitName(userName);

    // 4️⃣ Calcular CP total
    const totalCP = pacote.quantidade_cp + (pacote.bonus_cp || 0);

    // 5️⃣ Criar registro de pagamento
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
      return NextResponse.json(
        { error: 'Erro ao criar registro de pagamento' },
        { status: 500 }
      );
    }

    // 6️⃣ Validar CPF
    const cpfFormatado = userProfile.cpf ? validarCPF(userProfile.cpf) : null;
    
    // 7️⃣ Formatar telefone
    const phoneFormatted = formatPhone(userProfile.telefone || null);

    // 8️⃣ ✅ CRIAR PREFERÊNCIA COM TODAS AS MELHORIAS
    const preferenceData: any = {
      // ✅ ITEMS COM CATEGORY_ID
      items: [
        {
          id: pacote.id.toString(),
          title: `${pacote.nome} - ${totalCP} CP`,
          description: pacote.descricao || `Pacote de ${totalCP} Clash Points para Naruto Clash`,
          category_id: 'virtual_goods', // 👈 Categoria para melhor aprovação
          quantity: 1,
          unit_price: Number(pacote.preco_brl),
          currency_id: 'BRL',
        },
      ],

      // ✅ PAYER COM DADOS COMPLETOS
      payer: {
        name: firstName,
        surname: lastName, // 👈 Sobrenome separado
        email: userEmail,
        
        // CPF (se disponível)
        ...(cpfFormatado && {
          identification: {
            type: 'CPF',
            number: cpfFormatado,
          },
        }),
        
        // 👈 Telefone (se disponível)
        ...(phoneFormatted && {
          phone: phoneFormatted,
        }),
        
        // 👈 Endereço (se disponível)
        ...(userProfile.cep && {
          address: {
            zip_code: userProfile.cep.replace(/\D/g, ''),
            street_name: userProfile.endereco || 'Endereço não informado',
            street_number: userProfile.numero || 'S/N',
          },
        }),
      },

      // URLs de retorno
      back_urls: {
        success: `${NEXT_PUBLIC_SITE_URL}/buy/success`,
        failure: `${NEXT_PUBLIC_SITE_URL}/buy/failure`,
        pending: `${NEXT_PUBLIC_SITE_URL}/buy/pending`,
      },
      auto_return: 'approved' as const,
      
      // Webhook
      notification_url: `${NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
      
      // Referência externa
      external_reference: pagamento.id.toString(),
      
      // Descrição no extrato
      statement_descriptor: 'NARUTO CLASH CP',
      
      // ✅ METADATA COMPLETO
      metadata: {
        user_id: user_id,
        user_name: userName,
        user_email: userEmail,
        pacote_id: pacote.id,
        package_name: pacote.nome,
        pagamento_id: pagamento.id,
        total_cp: totalCP,
        platform: 'web',
        created_at: new Date().toISOString(),
        // Device ID para anti-fraude
        ...(device_session_id && { device_session_id }),
      },

      // Configurações de segurança
      binary_mode: true,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      
      // ✅ CORRIGIDO: Configurações de métodos de pagamento SEM default_payment_method_id
      payment_methods: {
        // Número máximo de parcelas
        installments: 12,
        
        // Pix fica disponível automaticamente
        // O Mercado Pago mostra Pix em destaque por padrão
      },
      
      // 👈 Device ID e informações adicionais para anti-fraude
      ...(device_session_id && {
        additional_info: {
          payer: {
            first_name: firstName,
            last_name: lastName,
          },
          items: [
            {
              id: pacote.id.toString(),
              title: pacote.nome,
              description: pacote.descricao,
              category_id: 'virtual_goods',
              quantity: 1,
              unit_price: Number(pacote.preco_brl),
            },
          ],
          shipments: {
            receiver_address: {
              zip_code: userProfile.cep?.replace(/\D/g, '') || '00000000',
              street_name: userProfile.endereco || 'Digital',
              street_number: userProfile.numero || '0',
            },
          },
        },
      }),
    };

    console.log('📤 Enviando preferência ao Mercado Pago...');
    console.log('🔐 Device ID:', !!device_session_id);
    console.log('📱 Telefone:', !!phoneFormatted);
    console.log('🏠 Endereço:', !!userProfile.cep);
    console.log('🆔 CPF:', !!cpfFormatado);

    // 9️⃣ Criar preferência
    let response;
    try {
      response = await preference.create({ body: preferenceData });
      console.log('✅ Preferência criada:', response.id);
    } catch (mpError: any) {
      console.error('❌ Erro no Mercado Pago:', mpError);
      return NextResponse.json(
        { 
          error: 'Erro ao criar preferência', 
          message: mpError.message || 'Erro ao comunicar com Mercado Pago',
        },
        { status: 500 }
      );
    }

    // 🔟 Atualizar registro
    await supabase
      .from('pagamentos_mercadopago')
      .update({ preference_id: response.id })
      .eq('id', pagamento.id);

    // ✅ Retornar link
    return NextResponse.json({
      preference_id: response.id,
      init_point: response.init_point,
      pagamento_id: pagamento.id,
    });

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API de preferências CORRIGIDA - v2.1',
    improvements: [
      'category_id adicionado aos items',
      'first_name e last_name separados',
      'telefone incluído (se disponível)',
      'endereço incluído (se disponível)',
      'metadata expandido',
      'additional_info com device_id',
      '🔧 CORRIGIDO: removido default_payment_method_id que causava conflito',
    ],
    timestamp: new Date().toISOString(),
  });
}