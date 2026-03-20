import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { room_id, clan_b_id, clan_b_name, leader_profile } = await req.json();
    if (!room_id || !clan_b_id || !clan_b_name || !leader_profile) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Validar JWT do usuário usando o anon key (respeita RLS e valida autenticação)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const jwt = authHeader.slice(7);

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(jwt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar que o líder que está aceitando é o próprio usuário autenticado
    if (user.id !== leader_profile.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Cliente com service role apenas para as operações de escrita
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Buscar sala
    const { data: room } = await supabase
      .from('war_rooms').select('*').eq('id', room_id).single();
    if (!room || room.status !== 'waiting' || room.clan_b_id) {
      return NextResponse.json({ error: 'Sala indisponível' }, { status: 400 });
    }

    // Atualizar guerra com clã B
    await supabase.from('clan_wars')
      .update({ clan_b_id, clan_b_name })
      .eq('id', room.war_id);

    // Atualizar sala
    await supabase.from('war_rooms')
      .update({ clan_b_id, clan_b_name })
      .eq('id', room_id);

    return NextResponse.json({ ok: true, war_id: room.war_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}