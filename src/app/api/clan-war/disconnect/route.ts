/**
 * POST /api/clan-war/disconnect
 * Marcado quando o cliente detecta desconexão (beforeunload / visibilitychange).
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== player_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await supabase.from('clan_war_members')
      .update({ disconnected: true })
      .eq('war_id', war_id)
      .eq('player_id', player_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}