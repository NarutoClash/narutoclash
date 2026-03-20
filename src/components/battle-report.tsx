'use client';

/**
 * BattleReport — componente de relatório de batalha visual
 * Usado em: Invasão, Caçadas, Batalha de Clã
 */

import { RichBattleLogEntry, BuildEffect } from '@/lib/battle-system/types';
import { cn } from '@/lib/utils';

// ─── HP Bar ───────────────────────────────────────────────────────────
function HpBar({ pct, color }: { pct: number; color: string }) {
  const safeP = Math.max(0, Math.min(100, pct));
  const barColor =
    safeP > 60 ? '#22c55e' :
    safeP > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${safeP}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

// ─── Build Badge ──────────────────────────────────────────────────────
function BuildBadge({ emoji, name, color }: { emoji: string; name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {emoji} {name}
    </span>
  );
}

// ─── Effect Tag ───────────────────────────────────────────────────────
const DAMAGE_EFFECT_TYPES = new Set([
  'burn_damage', 'item_veneno', 'item_veneno_tick', 'item_queimadura',
  'item_paralisia', 'item_refletir', 'barrier_blocked', 'item_barreira_absorveu',
  'burn_applied', 'paralysis_skipped', 'weaken_applied',
]);

const HEAL_EFFECT_TYPES = new Set([
  'regen', 'item_regeneracao', 'item_lifesteal', 'survived_death',
]);

function EffectTag({ effect }: { effect: BuildEffect }) {
  const isDamage = DAMAGE_EFFECT_TYPES.has(effect.type);
  const isHeal   = HEAL_EFFECT_TYPES.has(effect.type);

  const color = isDamage ? '#ef4444' : isHeal ? '#22c55e' : (effect.color || '#ffcc00');
  const prefix = isDamage ? '-' : '+';
  const showValue = effect.value != null && effect.value > 0 && (isDamage || isHeal);

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      <span>{effect.label}</span>
      {showValue && (
        <span className="font-bold opacity-90">
          {prefix}{Math.round(effect.value!)}
        </span>
      )}
    </div>
  );
}

// ─── Turn Card ────────────────────────────────────────────────────────
function TurnCard({
  entry,
  playerName,
  opponentName,
  context,
}: {
  entry: Exclude<RichBattleLogEntry, string>;
  playerName: string;
  opponentName: string;
  context: 'invasion' | 'hunt' | 'clan';
}) {
  const isPlayer = entry.attacker === 'player';
  const isBoss   = entry.attacker === 'boss';

  const borderColor = isPlayer
    ? '#ffcc00'
    : isBoss ? '#ef4444' : '#6366f1';

  const bgGradient = isPlayer
    ? 'from-yellow-950/30 to-transparent'
    : isBoss
      ? 'from-red-950/30 to-transparent'
      : 'from-indigo-950/30 to-transparent';

  const attackerLabel = isPlayer
    ? playerName
    : isBoss
      ? opponentName
      : opponentName;

  const attackerIcon = isPlayer ? '⚔️' : isBoss ? '💀' : '🔵';

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 p-3 bg-gradient-to-r',
        bgGradient,
        'mb-2 last:mb-0'
      )}
      style={{ borderLeftColor: borderColor, backgroundColor: '#0e090088' }}
    >
      {/* Header do turno */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#4d3300]">T{entry.turn}</span>
          <span className="text-xs font-bold" style={{ color: borderColor }}>
            {attackerIcon} {attackerLabel}
          </span>
          {entry.attackerBuild && entry.attackerBuildEmoji && (
            <BuildBadge
              emoji={entry.attackerBuildEmoji}
              name={entry.attackerBuild}
              color={entry.attackerBuildColor || '#94a3b8'}
            />
          )}
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono"
          style={{
            backgroundColor: entry.attackType === 'ninjutsu' ? '#3b82f622' :
                             entry.attackType === 'genjutsu' ? '#a855f722' : '#f9731622',
            color: entry.attackType === 'ninjutsu' ? '#60a5fa' :
                   entry.attackType === 'genjutsu' ? '#c084fc' : '#fb923c',
          }}
        >
          {entry.attackType}
        </span>
      </div>

      {/* ── Seção 1: Início do turno (burn/veneno/regen) ── */}
      {entry.startOfTurnEffects && entry.startOfTurnEffects.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded" style={{ backgroundColor: '#00000033', borderLeft: '2px solid #44444466' }}>
          <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1">⏱ Início do turno</p>
          <div className="flex flex-col gap-1">
            {entry.startOfTurnEffects.map((ef, i) => <EffectTag key={i} effect={ef} />)}
          </div>
        </div>
      )}

      {/* GIF do jutsu - apenas para o jogador */}
      {entry.jutsuGif && isPlayer && (
        <div className="flex justify-center my-2">
          <img
            src={entry.jutsuGif}
            alt={entry.jutsuName}
            className="w-28 h-28 rounded-lg object-cover border-2"
            style={{ borderColor }}
          />
        </div>
      )}

      {/* Nome do jutsu - apenas para o jogador */}
      <p className="text-sm font-bold mb-1" style={{ color: borderColor }}>
        {isPlayer ? entry.jutsuName : '???'}
      </p>

      {/* Log de dano */}
      <p className="text-xs text-[#a87800] font-mono mb-1">{entry.damageLog}</p>

      {/* Dano total */}
      {entry.totalDamage > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-black" style={{ color: borderColor }}>
            💥 {entry.totalDamage.toLocaleString()}
          </span>
          {entry.isCritical && (
            <span className="text-xs font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">
              CRÍTICO ×1.5
            </span>
          )}
        </div>
      )}

      {/* Segundo hit */}
      {entry.secondHit && (
        <div className="text-xs font-semibold text-emerald-400 mb-1">
          ➕ {isPlayer ? entry.secondHit.jutsuName : '???'}: +{entry.secondHit.damage.toFixed(0)} de dano
        </div>
      )}

      {/* Efeitos ofensivos de build/passiva */}
      {entry.buildEffects && entry.buildEffects.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {entry.buildEffects.map((ef, i) => <EffectTag key={i} effect={ef} />)}
        </div>
      )}

      {/* ── Seção 3: Reações ao ataque (barreira, refletir) ── */}
      {entry.reactionEffects && entry.reactionEffects.length > 0 && (
        <div className="mt-2 px-2 py-1.5 rounded" style={{ backgroundColor: '#38bdf408', borderLeft: '2px solid #38bdf444' }}>
          <p className="text-[10px] font-bold text-[#38bdf4aa] uppercase tracking-widest mb-1">⚡ Reação do defensor</p>
          <div className="flex flex-col gap-1">
            {entry.reactionEffects.map((ef, i) => <EffectTag key={i} effect={ef} />)}
          </div>
        </div>
      )}

      {/* Barras de HP */}
      <div className="mt-2 space-y-1">
        {entry.playerHealthPct != null && (
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#a87800]">{playerName}</span>
              <span className="text-[#a87800] font-mono">{entry.playerHealth}</span>
            </div>
            <HpBar pct={entry.playerHealthPct} color="#22c55e" />
          </div>
        )}
        {entry.opponentHealthPct != null && (
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#a87800]">{opponentName}</span>
              <span className="text-[#a87800] font-mono">{entry.opponentHealth}</span>
            </div>
            <HpBar pct={entry.opponentHealthPct} color="#ef4444" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Battle Header ────────────────────────────────────────────────────
export function BattleHeader({
  playerName, playerLevel, playerBuild, playerBuildEmoji, playerBuildColor,
  opponentName, opponentLevel, opponentBuild, opponentBuildEmoji, opponentBuildColor,
  context,
  clanName, opponentClanName,
}: {
  playerName: string; playerLevel?: number;
  playerBuild?: string; playerBuildEmoji?: string; playerBuildColor?: string;
  opponentName: string; opponentLevel?: number;
  opponentBuild?: string; opponentBuildEmoji?: string; opponentBuildColor?: string;
  context: 'invasion' | 'hunt' | 'clan';
  clanName?: string; opponentClanName?: string;
}) {
  return (
    <div
      className="rounded-lg p-4 mb-3 text-center"
      style={{ background: 'linear-gradient(135deg, #1a1208, #0e0900)', border: '1px solid #ffcc0044' }}
    >
      {context === 'invasion' && (
        <p className="text-xs text-[#7a5c12] font-bold mb-2 tracking-widest">⚔️ INVASÃO — BOSS</p>
      )}
      {context === 'clan' && (
        <p className="text-xs text-purple-400 font-bold mb-2 tracking-widest">🏯 BATALHA ENTRE CLÃS</p>
      )}
      {context === 'hunt' && (
        <p className="text-xs text-[#7a5c12] font-bold mb-2 tracking-widest">🎯 CAÇADA</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Jogador */}
        <div className="flex-1 text-left">
          <p className="font-black text-sm text-[#ffcc00]">{playerName}</p>
          {playerLevel != null && <p className="text-xs text-[#7a5c12]">Nível {playerLevel}</p>}
          {clanName && <p className="text-xs text-yellow-600">{clanName}</p>}
          {playerBuild && playerBuildEmoji && (
            <div className="mt-1">
              <BuildBadge emoji={playerBuildEmoji} name={playerBuild} color={playerBuildColor || '#94a3b8'} />
            </div>
          )}
        </div>

        <div className="text-[#ffcc00] font-black text-lg">⚡VS⚡</div>

        {/* Oponente */}
        <div className="flex-1 text-right">
          <p className="font-black text-sm text-red-400">{opponentName}</p>
          {opponentLevel != null && <p className="text-xs text-[#7a5c12]">Nível {opponentLevel}</p>}
          {opponentClanName && <p className="text-xs text-purple-400">{opponentClanName}</p>}
          {opponentBuild && opponentBuildEmoji && (
            <div className="mt-1 flex justify-end">
              <BuildBadge emoji={opponentBuildEmoji} name={opponentBuild} color={opponentBuildColor || '#94a3b8'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Battle Result ────────────────────────────────────────────────────
export function BattleResult({
  winner, totalTurns, totalDamageDealt, totalDamageTaken,
  critCount, passiveCount, ryoGained, xpGained,
  clanWinner, playerWarPoints, opponentWarPoints,
  context,
}: {
  winner: string; totalTurns?: number;
  totalDamageDealt?: number; totalDamageTaken?: number;
  critCount?: number; passiveCount?: number;
  ryoGained?: number; xpGained?: number;
  clanWinner?: string;
  playerWarPoints?: number; opponentWarPoints?: number;
  context: 'invasion' | 'hunt' | 'clan';
}) {
  return (
    <div
      className="rounded-lg p-4 mt-3"
      style={{ background: 'linear-gradient(135deg, #1a1208, #0e0900)', border: '2px solid #ffcc00' }}
    >
      <p className="text-center text-lg font-black text-[#ffcc00] mb-3">🏆 {winner} venceu!</p>

      {context === 'clan' && clanWinner && (
        <div className="text-center mb-3 space-y-1">
          <p className="text-sm font-bold text-[#ffcc00]">🏯 {clanWinner}</p>
          {playerWarPoints != null && (
            <p className="text-xs text-green-400">▲ +1 War Point → {playerWarPoints} total</p>
          )}
          {opponentWarPoints != null && (
            <p className="text-xs text-red-400">▼ -1 War Point → {opponentWarPoints} total</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        {totalTurns != null && (
          <div className="bg-black/30 rounded p-2">
            <p className="text-[#7a5c12]">Duração</p>
            <p className="font-bold text-[#ffcc00]">{totalTurns} turnos</p>
          </div>
        )}
        {totalDamageDealt != null && (
          <div className="bg-black/30 rounded p-2">
            <p className="text-[#7a5c12]">Dano causado</p>
            <p className="font-bold text-orange-400">{totalDamageDealt.toLocaleString()}</p>
          </div>
        )}
        {totalDamageTaken != null && (
          <div className="bg-black/30 rounded p-2">
            <p className="text-[#7a5c12]">Dano recebido</p>
            <p className="font-bold text-red-400">{totalDamageTaken.toLocaleString()}</p>
          </div>
        )}
        {critCount != null && (
          <div className="bg-black/30 rounded p-2">
            <p className="text-[#7a5c12]">Críticos</p>
            <p className="font-bold text-yellow-400">⚡ {critCount}</p>
          </div>
        )}
        {passiveCount != null && passiveCount > 0 && (
          <div className="bg-black/30 rounded p-2">
            <p className="text-[#7a5c12]">Passivas ativadas</p>
            <p className="font-bold text-purple-400">✨ {passiveCount}</p>
          </div>
        )}
      </div>

      {(ryoGained != null || xpGained != null) && (
        <div className="flex gap-3 mt-3 justify-center text-sm font-bold">
          {ryoGained != null && <span className="text-yellow-400">💰 +{ryoGained.toLocaleString()} Ryo</span>}
          {xpGained != null && <span className="text-blue-400">📈 +{xpGained.toLocaleString()} XP</span>}
        </div>
      )}
    </div>
  );
}

// ─── BattleReport principal ───────────────────────────────────────────
interface BattleReportProps {
  log: RichBattleLogEntry[];
  playerName: string;
  opponentName: string;
  context: 'invasion' | 'hunt' | 'clan';
  playerBuild?: string;
  playerBuildEmoji?: string;
  playerBuildColor?: string;
  playerLevel?: number;
  opponentBuild?: string;
  opponentBuildEmoji?: string;
  opponentBuildColor?: string;
  opponentLevel?: number;
  clanName?: string;
  opponentClanName?: string;
}

export function BattleReport({
  log, playerName, opponentName, context,
  playerBuild, playerBuildEmoji, playerBuildColor, playerLevel,
  opponentBuild, opponentBuildEmoji, opponentBuildColor, opponentLevel,
  clanName, opponentClanName,
}: BattleReportProps) {
  if (!log.length) return null;

  return (
    <div
      className="rounded-xl p-3 max-h-[500px] overflow-y-auto"
      style={{ background: '#0e090088', border: '1px solid #ffcc0033' }}
    >
      {/* Cabeçalho */}
      <BattleHeader
        playerName={playerName} playerLevel={playerLevel}
        playerBuild={playerBuild} playerBuildEmoji={playerBuildEmoji} playerBuildColor={playerBuildColor}
        opponentName={opponentName} opponentLevel={opponentLevel}
        opponentBuild={opponentBuild} opponentBuildEmoji={opponentBuildEmoji} opponentBuildColor={opponentBuildColor}
        context={context} clanName={clanName} opponentClanName={opponentClanName}
      />

      {/* Entradas do log */}
      {log.map((entry, i) => {
        if (typeof entry === 'string') {
          return (
            <p key={i} className="text-xs text-[#7a5c12] font-mono my-1 px-1">{entry}</p>
          );
        }
        return (
          <TurnCard
            key={i}
            entry={entry}
            playerName={playerName}
            opponentName={opponentName}
            context={context}
          />
        );
      })}
    </div>
  );
}