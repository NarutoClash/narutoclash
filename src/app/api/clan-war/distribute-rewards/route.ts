/**
 * POST /api/clan-war/distribute-rewards
 * Distribui prêmios da liga semanal ou mensal ao encerrar o período.
 * Chamada por um cron job externo (ex: Vercel Cron, Supabase pg_cron no paid,
 * ou GitHub Actions agendado) ou manualmente pelo admin.
 *
 * Body: { period_type: 'weekly' | 'monthly', period_key: '2025-W23' | '2025-06', secret: string }
 *
 * Premios configurados em clan_league_reward_config.
 * Distribui ryo na treasury do clã + xp no clã.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_SECRET = process.env.LEAGUE_REWARD_SECRET || 'troca-isso';

export async function POST(req: NextRequest) {
  try {
    const { period_type, period_key, secret } = await req.json();

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (!period_type || !period_key) {
      return NextResponse.json({ error: 'period_type e period_key obrigatórios' }, { status: 400 });
    }

    // Service role — acesso total
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verificar se já foram distribuídos
    const { data: existing } = await supabase
      .from('clan_league_rewards')
      .select('id')
      .eq('period_type', period_type)
      .eq('period_key', period_key)
      .eq('distributed', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'já distribuído' });
    }

    // Buscar top 3 da liga no período
    const { data: ranking } = await supabase
      .from('clan_league_points')
      .select('clan_id, clan_name, points, wars_played, wars_won')
      .eq('period_type', period_type)
      .eq('period_key', period_key)
      .order('points', { ascending: false })
      .order('wars_won', { ascending: false })
      .limit(3);

    if (!ranking || ranking.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'nenhum clã participou' });
    }

    // Buscar configuração de prêmios
    const { data: configs } = await supabase
      .from('clan_league_reward_config')
      .select('*')
      .eq('period_type', period_type);

    const configMap: Record<number, any> = {};
    (configs || []).forEach(c => { configMap[c.position] = c; });

    const distributed = [];

    for (let i = 0; i < ranking.length; i++) {
      const entry   = ranking[i];
      const position = i + 1;
      const config  = configMap[position];
      if (!config) continue;

      // Adicionar ryo na treasury do clã
      if (config.reward_ryo > 0) {
        const { data: clan } = await supabase
          .from('clans').select('treasury_ryo, xp').eq('id', entry.clan_id).single();
        if (clan) {
          await supabase.from('clans').update({
            treasury_ryo: (clan.treasury_ryo || 0) + config.reward_ryo,
            xp:           (clan.xp           || 0) + (config.reward_xp || 0),
          }).eq('id', entry.clan_id);
        }
      }

      // Registrar recompensa
      await supabase.from('clan_league_rewards').upsert({
        period_type,
        period_key,
        position,
        clan_id:      entry.clan_id,
        clan_name:    entry.clan_name,
        points:       entry.points,
        reward_ryo:   config.reward_ryo,
        reward_xp:    config.reward_xp || 0,
        reward_label: config.reward_label,
        distributed:  true,
      }, { onConflict: 'period_type,period_key,position' });

      distributed.push({ position, clan: entry.clan_name, ryo: config.reward_ryo });
    }

    return NextResponse.json({ ok: true, distributed });
  } catch (err: any) {
    console.error('[distribute-rewards]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
