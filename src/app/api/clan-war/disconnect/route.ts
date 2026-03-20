/**
 * POST /api/clan-war/disconnect
 * Marcado quando o cliente detecta desconexão (beforeunload / visibilitychange).
 * Usa sendBeacon — não há cookie de sessão disponível, então NÃO chamamos getUser().
 * A validação é feita verificando se war_id + player_id existem na tabela e a guerra está ativa.
 * hp_current → 0 é aplicado pelo engine no próximo turno.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { war_id, player_id } = await req.json();
    if (!war_id || !player_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validar que o membro realmente pertence a esta guerra ativa
    // (evita que alguém desconecte outro jogador enviando IDs arbitrários)
    const { data: member, error: memberError } = await supabase
      .from('clan_war_members')
      .select('id, is_alive')
      .eq('war_id', war_id)
      .eq('player_id', player_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membro não encontrado nesta guerra' }, { status: 404 });
    }

    // Verificar que a guerra ainda está ativa
    const { data: war } = await supabase
      .from('clan_wars')
      .select('status')
      .eq('id', war_id)
      .single();

    if (!war || war.status !== 'active') {
      return NextResponse.json({ ok: true }); // Guerra já encerrada — ignorar silenciosamente
    }

    await supabase
      .from('clan_war_members')
      .update({ disconnected: true })
      .eq('war_id', war_id)
      .eq('player_id', player_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}