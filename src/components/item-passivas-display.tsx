'use client';

import { cn } from '@/lib/utils';
import type { ItemPassive } from '@/lib/battle-system/types';

// ─── Labels amigáveis ──────────────────────────────────────────────────

const EFEITO_LABEL: Record<string, string> = {
  veneno:      'Veneno',
  queimadura:  'Queimadura',
  paralisia:   'Paralisia',
  selar_jutsu: 'Sela Jutsu',
  lifesteal:   'Roubo de Vida',
  regeneracao: 'Regeneração',
  enfraquecer: 'Enfraquece Alvo',
  barreira:    'Barreira',
  refletir:    'Refletir Dano',
  ignorar_cap: 'Ignora Cap de Dano',
};

const EFEITO_COR: Record<string, string> = {
  veneno:      'text-green-400 border-green-400/30 bg-green-400/10',
  queimadura:  'text-orange-400 border-orange-400/30 bg-orange-400/10',
  paralisia:   'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  selar_jutsu: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  lifesteal:   'text-red-400 border-red-400/30 bg-red-400/10',
  regeneracao: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  enfraquecer: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  barreira:    'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  refletir:    'text-pink-400 border-pink-400/30 bg-pink-400/10',
  ignorar_cap: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

const GATILHO_LABEL: Record<string, string> = {
  ao_atacar:        'Ao Atacar',
  ao_receber_dano:  'Ao Receber Dano',
  inicio_turno:     'Início do Turno',
  ao_usar_taijutsu: 'Ao usar Taijutsu',
  ao_usar_ninjutsu: 'Ao usar Ninjutsu',
  ao_usar_genjutsu: 'Ao usar Genjutsu',
};

// ─── Componente ────────────────────────────────────────────────────────

interface ItemPassivasDisplayProps {
  passivas: ItemPassive[];
  /** 'compact' = badge pequeno | 'full' = card expandido */
  mode?: 'compact' | 'full';
  className?: string;
}

export function ItemPassivasDisplay({
  passivas,
  mode = 'full',
  className,
}: ItemPassivasDisplayProps) {
  if (!passivas || passivas.length === 0) return null;

  if (mode === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-1 mt-2', className)}>
        {passivas.map((p) => (
          <span
            key={p.id}
            title={p.descricao}
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border',
              EFEITO_COR[p.efeito] ?? 'text-slate-400 border-slate-400/30 bg-slate-400/10'
            )}
          >
            {p.emoji} {p.nome}
          </span>
        ))}
      </div>
    );
  }

  // mode === 'full'
  return (
    <div className={cn('mt-3 space-y-2', className)}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        ⚡ Passivas de Batalha
      </p>
      {passivas.map((p) => {
        const chancePct = Math.round(p.chance * 100);
        const corClass = EFEITO_COR[p.efeito] ?? 'text-slate-400 border-slate-400/30 bg-slate-400/10';

        return (
          <div
            key={p.id}
            className={cn(
              'rounded-md border px-3 py-2 text-sm space-y-1',
              corClass
            )}
          >
            {/* Linha 1: nome + badge efeito */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold">
                {p.emoji} {p.nome}
              </span>
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                corClass
              )}>
                {EFEITO_LABEL[p.efeito] ?? p.efeito}
              </span>
            </div>

            {/* Linha 2: descrição */}
            <p className="text-xs opacity-80 leading-relaxed">{p.descricao}</p>

            {/* Linha 3: chance + gatilho + valor */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium opacity-90 pt-0.5">
              <span>🎲 {chancePct}% de chance</span>
              <span>🔔 {GATILHO_LABEL[p.gatilho] ?? p.gatilho}</span>
              {p.valor !== undefined && (
                <span>📊 Valor: {Math.round(p.valor * 100)}%</span>
              )}
              {p.ativaApos50HP && (
                <span className="text-rose-400">❤️ Ativa após -50% HP</span>
              )}
              {p.barreiraPorTurno && (
                <span className="text-cyan-400">🛡️ 1× por turno</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
