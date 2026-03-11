-- ═══════════════════════════════════════════════════════════════════════
-- SISTEMA DE LIGA — Guerra de Clãs
-- Execute no Supabase SQL Editor (após o migration.sql principal)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Novas colunas na tabela clans ──────────────────────────────────
ALTER TABLE clans
  ADD COLUMN IF NOT EXISTS win_streak   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak  int NOT NULL DEFAULT 0;

-- ── 2. Novas colunas em clan_wars (dano e kills acumulados) ───────────
ALTER TABLE clan_wars
  ADD COLUMN IF NOT EXISTS kills_a        int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kills_b        int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_damage_a bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_damage_b bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS winner_pts     int,
  ADD COLUMN IF NOT EXISTS loser_pts      int;

-- ── 3. Tabela de liga (semanal + mensal) ──────────────────────────────
-- period_type: 'weekly' | 'monthly'
-- period_key:  '2025-W23' | '2025-06'
CREATE TABLE IF NOT EXISTS clan_league_points (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id      uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan_name    text NOT NULL,
  period_type  text NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_key   text NOT NULL,
  points       int  NOT NULL DEFAULT 0,
  wars_played  int  NOT NULL DEFAULT 0,
  wars_won     int  NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clan_id, period_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_league_period ON clan_league_points(period_type, period_key, points DESC);
CREATE INDEX IF NOT EXISTS idx_league_clan   ON clan_league_points(clan_id);

-- ── 4. RLS na tabela de liga ──────────────────────────────────────────
ALTER TABLE clan_league_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "league_select" ON clan_league_points
  FOR SELECT TO authenticated USING (true);

-- Apenas service role escreve (via API Route)

-- ── 5. View para ranking semanal atual ───────────────────────────────
-- Usada na página de ranking — basta fazer SELECT * FROM clan_weekly_ranking
CREATE OR REPLACE VIEW clan_weekly_ranking AS
SELECT
  lp.clan_id,
  lp.clan_name,
  lp.points,
  lp.wars_played,
  lp.wars_won,
  c.win_streak,
  c.level,
  c.tag,
  RANK() OVER (ORDER BY lp.points DESC, lp.wars_won DESC) AS position
FROM clan_league_points lp
JOIN clans c ON c.id = lp.clan_id
WHERE lp.period_type = 'weekly'
  AND lp.period_key = (
    -- ISO week key da semana atual
    TO_CHAR(NOW(), 'IYYY') || '-W' || LPAD(TO_CHAR(NOW(), 'IW'), 2, '0')
  )
ORDER BY lp.points DESC;

-- ── 6. View para ranking mensal atual ────────────────────────────────
CREATE OR REPLACE VIEW clan_monthly_ranking AS
SELECT
  lp.clan_id,
  lp.clan_name,
  lp.points,
  lp.wars_played,
  lp.wars_won,
  c.win_streak,
  c.level,
  c.tag,
  RANK() OVER (ORDER BY lp.points DESC, lp.wars_won DESC) AS position
FROM clan_league_points lp
JOIN clans c ON c.id = lp.clan_id
WHERE lp.period_type = 'monthly'
  AND lp.period_key = TO_CHAR(NOW(), 'YYYY-MM')
ORDER BY lp.points DESC;

-- ── 7. Tabela de prêmios de liga ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS clan_league_rewards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type  text NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_key   text NOT NULL,
  position     int  NOT NULL,  -- 1º, 2º, 3º lugar
  clan_id      uuid NOT NULL REFERENCES clans(id),
  clan_name    text NOT NULL,
  points       int  NOT NULL,
  reward_ryo   int  NOT NULL DEFAULT 0,
  reward_xp    int  NOT NULL DEFAULT 0,
  reward_label text,           -- ex: "Campeão Semanal 🏆"
  distributed  bool NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_type, period_key, position)
);

ALTER TABLE clan_league_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_select" ON clan_league_rewards
  FOR SELECT TO authenticated USING (true);

-- ── 8. Tabela de configuração de prêmios ──────────────────────────────
-- Você define aqui quanto ganha cada posição em cada liga
CREATE TABLE IF NOT EXISTS clan_league_reward_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  position    int  NOT NULL,
  reward_ryo  int  NOT NULL DEFAULT 0,
  reward_xp   int  NOT NULL DEFAULT 0,
  reward_label text,
  UNIQUE (period_type, position)
);

-- Inserir configuração padrão (ajuste os valores como quiser)
INSERT INTO clan_league_reward_config (period_type, position, reward_ryo, reward_xp, reward_label) VALUES
  -- Semanal
  ('weekly', 1, 10000, 500, '🥇 Campeão Semanal'),
  ('weekly', 2,  5000, 250, '🥈 Vice Semanal'),
  ('weekly', 3,  2500, 100, '🥉 3º Semanal'),
  -- Mensal
  ('monthly', 1, 50000, 2000, '👑 Campeão Mensal'),
  ('monthly', 2, 25000, 1000, '🏆 Vice Mensal'),
  ('monthly', 3, 10000,  500, '🎖️ 3º Mensal')
ON CONFLICT (period_type, position) DO NOTHING;

