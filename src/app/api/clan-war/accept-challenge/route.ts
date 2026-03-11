/**
 * POST /api/clan-war/accept-challenge
 * Líder do Clã B aceita o desafio do Clã A — atualiza a sala e a guerra.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { room_id, clan_b_id, clan_b_name, leader_profile } = await req.json();
    if (!room_id || !clan_b_id || !clan_b_name || !leader_profile) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

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