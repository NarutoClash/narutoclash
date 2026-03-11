'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Activity, Flame, ScrollText, Target, Swords, Users,
  Utensils, Eye, Footprints, Grip, Crown, Zap,
  Heart, Brain, Shield, Sparkles, TrendingUp, Trophy, Coins, Star,
  Sword, Map, Skull, ChevronRight, Lock,
  ShieldAlert, BarChart2, Crosshair, Award, Timer, Layers, Globe
} from 'lucide-react';

// ─── Componentes utilitários ─────────────────────────────────────────

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h2 className="text-xl font-bold tracking-tight">{children}</h2>
  </div>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold mt-6 mb-3 text-foreground/90 flex items-center gap-2">
    <ChevronRight className="h-4 w-4 text-primary" />
    {children}
  </h3>
);

const InfoBox = ({
  title, variant = 'default', children,
}: {
  title: string; variant?: 'default' | 'warning' | 'success' | 'info' | 'danger'; children: React.ReactNode;
}) => {
  const styles = {
    default: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
    success: 'border-green-500/30 bg-green-500/5 text-green-300',
    info: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
    danger: 'border-red-500/30 bg-red-500/5 text-red-300',
  };
  return (
    <div className={`rounded-lg border p-4 mb-4 ${styles[variant]}`}>
      <p className="font-semibold text-sm mb-2">{title}</p>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  );
};

const StatCard = ({ icon: Icon, name, color, bonus, description }: {
  icon: React.ElementType; name: string; color: string; bonus: string; description: string;
}) => (
  <div className={`rounded-lg border p-4 bg-gradient-to-br ${color}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-5 w-5" />
      <span className="font-bold text-sm">{name}</span>
    </div>
    <p className="text-xs text-muted-foreground mb-1">{description}</p>
    <Badge variant="outline" className="text-xs">{bonus}</Badge>
  </div>
);

const BuildCard = ({ emoji, name, color, stats, passives }: {
  emoji: string; name: string; color: string; stats: string; passives: string[];
}) => (
  <div className={`rounded-lg border p-4 ${color}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{emoji}</span>
      <span className="font-bold text-sm">{name}</span>
    </div>
    <p className="text-xs text-muted-foreground mb-2 font-medium">{stats}</p>
    <ul className="space-y-1">
      {passives.map((p, i) => (
        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
          <span className="text-primary mt-0.5">•</span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`flex justify-between items-center py-1.5 text-sm border-b border-border/30 last:border-0 ${highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

// ─── Tabs ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'inicio',       label: 'Início',      icon: BookOpen },
  { id: 'status',       label: 'Status',      icon: Activity },
  { id: 'batalha',      label: 'Batalha',     icon: Swords },
  { id: 'missoes',      label: 'Missões',     icon: Target },
  { id: 'cacadas',      label: 'Caçadas',     icon: Crosshair },
  { id: 'elementos',    label: 'Elementos',   icon: Flame },
  { id: 'jutsus',       label: 'Jutsus',      icon: ScrollText },
  { id: 'equipamentos', label: 'Equip.',      icon: Grip },
  { id: 'cla',          label: 'Clã',         icon: Users },
  { id: 'guerra',       label: 'Guerra 5v5',  icon: Shield },
  { id: 'invasao',      label: 'Invasão',     icon: ShieldAlert },
  { id: 'poderes',      label: 'Poderes',     icon: Eye },
  { id: 'ranking',      label: 'Ranking',     icon: Trophy },
  { id: 'ichiraku',     label: 'Ichiraku',    icon: Utensils },
  { id: 'premium',      label: 'Premium',     icon: Crown },
];

// ─── Conteúdo das abas ────────────────────────────────────────────────

const TabInicio = () => (
  <div className="space-y-6">
    <SectionTitle icon={BookOpen}>Bem-vindo ao Naruto Clash!</SectionTitle>
    <p className="text-sm text-muted-foreground leading-relaxed">
      Naruto Clash é um RPG ninja por turnos onde você cria um personagem, evolui seus atributos, aprende
      técnicas ninjas e compete com outros jogadores. Este manual explica todos os sistemas do jogo de forma
      clara e objetiva. Navegue pelas abas acima para aprender sobre cada sistema.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" /> Loop Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2"><span className="text-primary font-bold">1.</span> Complete Missões e Caçadas</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">2.</span> Ganhe XP, Ryo e evolua atributos</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">3.</span> Aprenda e melhore Jutsus</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">4.</span> Compre equipamentos melhores</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">5.</span> Entre em um Clã e participe das Guerras 5v5</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">6.</span> Enfrente o Boss da Invasão</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">7.</span> Suba no Ranking</div>
        </CardContent>
      </Card>

      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4 text-orange-400" /> Páginas do Jogo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <div><span className="text-orange-400 font-medium">Status</span> — Atributos e equipamentos</div>
          <div><span className="text-orange-400 font-medium">Missões</span> — Missões diárias para XP/Ryo</div>
          <div><span className="text-orange-400 font-medium">Caçadas</span> — Grinding e batalhas PvP</div>
          <div><span className="text-orange-400 font-medium">Guerra</span> — Batalhas 5v5 entre clãs</div>
          <div><span className="text-orange-400 font-medium">Invasão</span> — Boss global semanal</div>
          <div><span className="text-orange-400 font-medium">Elementos</span> — Treinar naturezas</div>
          <div><span className="text-orange-400 font-medium">Clã</span> — Sistema de grupos</div>
          <div><span className="text-orange-400 font-medium">Ichiraku</span> — Comprar consumíveis</div>
        </CardContent>
      </Card>
    </div>

    <InfoBox title="💡 Dica para Iniciantes" variant="success">
      <p>Comece distribuindo pontos em <strong>Ninjutsu</strong> e treinando <strong>Katon (Fogo)</strong>. Complete missões
      fáceis para ganhar XP rápido, compre equipamentos na aba Armas e junte-se a um Clã o quanto antes para aproveitar
      os bônus de tecnologias e participar das Guerras de Clã!</p>
    </InfoBox>

    <SubTitle>Moedas do Jogo</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="font-bold text-sm">Ryo 💰</span>
        </div>
        <p className="text-xs text-muted-foreground">Moeda principal obtida em missões, caçadas e batalhas PvP. Usada para comprar armas, armaduras, invocações e criar clã.</p>
      </div>
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-sm">Clash Points (CP) 💎</span>
        </div>
        <p className="text-xs text-muted-foreground">Moeda premium comprada com dinheiro real. Usada no Mercado Premium para obter itens exclusivos e Premium Pass.</p>
      </div>
    </div>
  </div>
);

const TabStatus = () => (
  <div className="space-y-6">
    <SectionTitle icon={Activity}>Sistema de Status</SectionTitle>
    <p className="text-sm text-muted-foreground">Os 6 atributos definem o poder do seu ninja. Você ganha <strong>5 pontos por nível</strong> para distribuir livremente.</p>

    <SubTitle>Os 6 Atributos</SubTitle>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard icon={Heart} name="Vitalidade" color="from-red-500/10 to-red-900/10 border-red-500/20" bonus="HP = 100 + Vit × 15" description="Controla sua vida máxima. Essencial para sobreviver em batalhas longas." />
      <StatCard icon={Brain} name="Inteligência" color="from-blue-500/10 to-blue-900/10 border-blue-500/20" bonus="Chakra = 100 + Int × 5" description="Controla chakra máximo e reduz dano de ninjutsu recebido." />
      <StatCard icon={Sword} name="Taijutsu" color="from-green-500/10 to-green-900/10 border-green-500/20" bonus="+1.3× dano físico" description="Poder dos ataques corpo-a-corpo. Melhorado por Futon." />
      <StatCard icon={Flame} name="Ninjutsu" color="from-orange-500/10 to-orange-900/10 border-orange-500/20" bonus="+1.4× dano elemental" description="Potência dos seus jutsus. Melhorado por Katon." />
      <StatCard icon={Eye} name="Genjutsu" color="from-purple-500/10 to-purple-900/10 border-purple-500/20" bonus="+1.2× dano ilusório" description="Força das ilusões. Melhorado por Doton." />
      <StatCard icon={Shield} name="Selo" color="from-yellow-500/10 to-yellow-900/10 border-yellow-500/20" bonus="+chance crítico" description="Aumenta a chance de acertos críticos (+0.1% por ponto). Melhorado por Raiton." />
    </div>

    <SubTitle>Bônus de Elementos nos Atributos</SubTitle>
    <InfoBox title="Cada nível de elemento concede +2 ao atributo correspondente:" variant="info">
      <div className="grid grid-cols-2 gap-1 mt-1">
        <span>🔥 Katon → +2 Ninjutsu/nível</span>
        <span>💨 Futon → +2 Taijutsu/nível</span>
        <span>⚡ Raiton → +2 Selo/nível</span>
        <span>🪨 Doton → +2 Genjutsu/nível</span>
        <span>💧 Suiton → +2 Inteligência/nível</span>
      </div>
    </InfoBox>

    <SubTitle>Vida e Chakra</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-400" /><span className="font-bold text-sm">Vida (HP)</span></div>
        <Row label="Fórmula" value="100 + (Vitalidade × 15)" />
        <Row label="Recuperação" value="Itens do Ichiraku" />
        <Row label="Em batalha" value="Se chegar a 0, você perde" />
      </div>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-400" /><span className="font-bold text-sm">Chakra</span></div>
        <Row label="Fórmula" value="100 + (Inteligência × 5)" />
        <Row label="Regen." value="1 por minuto (automático)" />
        <Row label="Usado em" value="Missões, Caçadas PvP, Guerra" />
      </div>
    </div>

    <SubTitle>Bônus de Guerra do Clã</SubTitle>
    <InfoBox title="Pontos de Guerra do clã concedem bônus a TODOS os membros" variant="success">
      <p>Fórmula: <strong>√(pontos de guerra) × 2</strong> — somado em todos os 6 atributos.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
        {[{pts:100,bonus:20},{pts:250,bonus:31},{pts:500,bonus:44},{pts:1000,bonus:63}].map(r => (
          <div key={r.pts} className="rounded border border-white/10 p-2 text-center">
            <div className="font-bold text-white">{r.pts} pts</div>
            <div className="text-green-400">+{r.bonus} stats</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs">Máximo: <strong>+63 em todos os atributos</strong> com 1000 pontos de guerra.</p>
    </InfoBox>

    <SubTitle>Ranks por Nível</SubTitle>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 text-center text-xs">
      {[
        { rank: 'Estudante', range: 'Nv. 1–9',    color: 'border-gray-500/30 bg-gray-500/5' },
        { rank: 'Genin',     range: 'Nv. 10–24',  color: 'border-green-500/30 bg-green-500/5' },
        { rank: 'Chunin',    range: 'Nv. 25–49',  color: 'border-blue-500/30 bg-blue-500/5' },
        { rank: 'Jounin',    range: 'Nv. 50–74',  color: 'border-purple-500/30 bg-purple-500/5' },
        { rank: 'ANBU',      range: 'Nv. 75–99',  color: 'border-red-500/30 bg-red-500/5' },
        { rank: 'Sennin',    range: 'Nv. 100+',   color: 'border-orange-500/30 bg-orange-500/5' },
        { rank: 'Kage',      range: 'TOP 1 Vila', color: 'border-yellow-500/30 bg-yellow-500/5' },
      ].map(r => (
        <div key={r.rank} className={`rounded-lg border p-2 ${r.color}`}>
          <div className="font-bold">{r.rank}</div>
          <div className="text-muted-foreground text-[10px]">{r.range}</div>
        </div>
      ))}
    </div>

    <InfoBox title="⚠️ Atenção ao distribuir pontos" variant="warning">
      Você <strong>não pode distribuir pontos</strong> enquanto estiver com Dōjutsu ou Selo Amaldiçoado <strong>ativos</strong>. Desative-os primeiro na página de Status. Pontos distribuídos <strong>não podem ser removidos</strong>.
    </InfoBox>
  </div>
);

const TabBatalha = () => (
  <div className="space-y-6">
    <SectionTitle icon={Swords}>Sistema de Batalha</SectionTitle>
    <p className="text-sm text-muted-foreground">As batalhas são automáticas e por turnos. Cada turno, tanto o jogador quanto o oponente realizam um ataque — o sistema escolhe o tipo de ataque com base nos atributos mais altos do personagem.</p>

    <SubTitle>Tipos de Ataque</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <div className="font-bold text-sm mb-1 flex items-center gap-2"><Swords className="h-4 w-4" /> Taijutsu</div>
        <p className="text-xs text-muted-foreground">Ataque físico. Usa o stat <strong>Taijutsu</strong>. Reduzido pela Inteligência do defensor.</p>
        <div className="mt-2 text-xs"><span className="font-medium">Fórmula:</span> (Tai × 1.3 + Selo × 0.3) – (Int × 0.9)</div>
      </div>
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="font-bold text-sm mb-1 flex items-center gap-2"><Flame className="h-4 w-4" /> Ninjutsu</div>
        <p className="text-xs text-muted-foreground">Jutsu elemental. Usa <strong>Ninjutsu</strong>, nível do elemento e nível do jutsu. Reduzido pela Inteligência.</p>
        <div className="mt-2 text-xs"><span className="font-medium">Fórmula:</span> (Ninj × 1.4) × elementMult × jutsuMult</div>
      </div>
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
        <div className="font-bold text-sm mb-1 flex items-center gap-2"><Eye className="h-4 w-4" /> Genjutsu</div>
        <p className="text-xs text-muted-foreground">Ilusão. Usa <strong>Genjutsu</strong> × 1.2. Pode ser resistido pela Inteligência do alvo.</p>
        <div className="mt-2 text-xs"><span className="font-medium">Fórmula:</span> (Gen × 1.2) – (Int × 0.6)</div>
      </div>
    </div>

    <SubTitle>Cap de Dano (PvP)</SubTitle>
    <InfoBox title="Limite de 60% da vida máxima por golpe" variant="warning">
      Em batalhas PvP, nenhum ataque pode tirar mais que <strong>60% do HP máximo do defensor</strong> de uma vez.
      Isso evita que ninjas de altíssimo ataque matem oponentes instantaneamente. Bosses <strong>não possuem esse limite</strong>.
    </InfoBox>

    <SubTitle>Críticos</SubTitle>
    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
      <Row label="Chance base" value="5%" />
      <Row label="Bônus do Selo" value="+0.1% por ponto de Selo" />
      <Row label="Dano crítico" value="×1.5 do dano normal" highlight />
    </div>

    <SubTitle>Passivas de Elemento (Nível 10)</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-lg border border-green-500/20 p-3 text-xs">
        <div className="font-bold mb-1">💨 Futon Lv.10 — Segundo Ataque</div>
        <div className="text-muted-foreground">30% de chance de atacar duas vezes. O segundo ataque causa 40% do dano do primeiro.</div>
      </div>
      <div className="rounded-lg border border-yellow-500/20 p-3 text-xs">
        <div className="font-bold mb-1">⚡ Raiton Lv.10 — Paralisia</div>
        <div className="text-muted-foreground">10% de chance de paralisar o oponente. O paralisado perde o próximo turno.</div>
      </div>
      <div className="rounded-lg border border-orange-500/20 p-3 text-xs">
        <div className="font-bold mb-1">🔥 Katon Lv.10 — Queimadura</div>
        <div className="text-muted-foreground">20% de chance de inflamar o oponente. Ele recebe 10% do dano do ataque como dano extra no início do próximo turno.</div>
      </div>
      <div className="rounded-lg border border-blue-500/20 p-3 text-xs">
        <div className="font-bold mb-1">💧 Suiton Lv.10 — Regeneração</div>
        <div className="text-muted-foreground">Recupera 5% do HP máximo a cada turno de batalha.</div>
      </div>
      <div className="rounded-lg border border-amber-700/20 p-3 text-xs">
        <div className="font-bold mb-1">🪨 Doton Lv.10 — Barreira</div>
        <div className="text-muted-foreground">Uma vez por batalha, absorve 50% do dano do primeiro ataque recebido.</div>
      </div>
    </div>

    <SubTitle>Builds (Arquétipos)</SubTitle>
    <p className="text-xs text-muted-foreground mb-3">O sistema detecta automaticamente seus 2 atributos mais altos e determina sua build, que concede passivas exclusivas em combate.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <BuildCard emoji="✨" name="Jutsushi (Feiticeiro)"      color="border-orange-500/20 bg-orange-500/5"  stats="Ninjutsu + Selo"        passives={['Cap de jutsuMult aumentado para ×2.2', 'Crítico de Ninjutsu aplica Queimadura (10% dano no turno seguinte)']} />
      <BuildCard emoji="🌑" name="Ankoku (Sombra)"          color="border-indigo-500/20 bg-indigo-500/5"  stats="Ninjutsu + Taijutsu"    passives={['30% de chance de atacar duas vezes por turno', 'Segundo ataque = 60% do dano principal']} />
      <BuildCard emoji="⚔️" name="Hachimon (Berserker)"       color="border-red-500/20 bg-red-500/5"        stats="Taijutsu + Selo"        passives={['+5% chance de crítico fixo', '+15% dano de Taijutsu', 'Crítico → próximo ataque ignora o cap de 35%']} />
      <BuildCard emoji="🛡️" name="Daikabe (Tanque)"          color="border-green-500/20 bg-green-500/5"    stats="Taijutsu + Vitalidade"  passives={['Recebe –20% de dano de todos os tipos', 'Ao levar crítico, devolve 30% do dano como Taijutsu']} />
      <BuildCard emoji="🎭" name="Kyomei (Ilusionista)"     color="border-purple-500/20 bg-purple-500/5"  stats="Taijutsu + Genjutsu"    passives={['Genjutsu resistido → próximo Taijutsu +50%', 'Genjutsu bem-sucedido → alvo recebe +20% dano no próximo turno']} />
      <BuildCard emoji="🔮" name="Kinjutsu (Artes Proibidas)" color="border-amber-500/20 bg-amber-500/5"    stats="Ninjutsu + Genjutsu"    passives={['Genjutsu bem-sucedido: 25% de selar Ninjutsu do alvo por 1 turno', 'Ninjutsu após genjutsu tem +20% dano']} />
      <BuildCard emoji="🌊" name="Shugosha (Guardião)"        color="border-cyan-500/20 bg-cyan-500/5"      stats="Ninjutsu + Vitalidade"  passives={['Regenera 3% do HP máximo por turno', 'Ninjutsu nunca causa menos de 15% do dano base']} />
      <BuildCard emoji="🔯" name="Chikan (Oráculo)"         color="border-lime-500/20 bg-lime-500/5"      stats="Ninjutsu + Inteligência"passives={['Recebe –50% de dano de Ninjutsu', 'Multiplicador elemental aumentado para ×0.07 por nível']} />
      <BuildCard emoji="👻" name="Reikon (Fantasma)"        color="border-fuchsia-500/20 bg-fuchsia-500/5"stats="Genjutsu + Selo"        passives={['Multiplicador de Genjutsu: ×1.6 (era ×1.2)', 'Selo entra no cálculo de Genjutsu (Selo × 0.4)']} />
      <BuildCard emoji="🧘" name="Seishin (Monge)"           color="border-emerald-500/20 bg-emerald-500/5"stats="Genjutsu + Inteligência"passives={['Inteligência entra no ataque de Genjutsu (Int × 0.5)', 'Recebe –40% de dano de Genjutsu']} />
      <BuildCard emoji="🌙" name="Kyoshi (Ermitão)"         color="border-violet-500/20 bg-violet-500/5"  stats="Inteligência + Selo"    passives={['Primeiro ataque da batalha é sempre crítico', 'Inteligência reduz dano de Genjutsu recebido em 60%']} />
      <BuildCard emoji="🏆" name="Taishō (Senhor da Guerra)"color="border-rose-500/20 bg-rose-500/5"      stats="Vitalidade + Selo"      passives={['Cada 100 pts de Vitalidade concedem +1% de crítico', 'Ao vencer, recupera 20% do HP perdido na batalha']} />
      <BuildCard emoji="💀" name="Kairai (Imortal)"         color="border-slate-500/20 bg-slate-500/5"     stats="Genjutsu + Vitalidade"  passives={['HP máximo +25% adicional', '20% de chance de sobreviver com 1 HP ao ser derrotado (1× por batalha)']} />
      <BuildCard emoji="🏯" name="Shirogane (Protetor)"     color="border-sky-500/20 bg-sky-500/5"         stats="Vitalidade + Inteligência" passives={['HP máximo usa fórmula: Vit×15 + Int×8 (em vez de só Vit×15)', 'Redução de todos os danos recebidos +15%']} />
      <BuildCard emoji="🧠" name="Shisaku (Físico Sábio)"   color="border-sky-400/20 bg-sky-400/5"         stats="Taijutsu + Inteligência" passives={['Inteligência entra no cálculo de Taijutsu (Int × 0.3)', 'Redução de dano de Ninjutsu recebido +25%']} />
    </div>
  </div>
);

const TabMissoes = () => (
  <div className="space-y-6">
    <SectionTitle icon={Target}>Missões</SectionTitle>
    <p className="text-sm text-muted-foreground">As missões são a principal fonte de XP, Ryo e evolução de Elementos e Jutsus. Você pode ter <strong>15 missões disponíveis</strong> que se renovam 2x por dia.</p>

    <SubTitle>Como Funcionam</SubTitle>
    <InfoBox title="Mecânica Básica" variant="default">
      <ul className="space-y-1">
        <li>• Missões renovam às <strong>00:00</strong> e às <strong>12:00 BRT</strong></li>
        <li>• Somente <strong>1 missão ativa por vez</strong></li>
        <li>• Custo em Chakra varia conforme a dificuldade e nível</li>
        <li>• Cada missão tem uma duração fixa — aguarde para coletar</li>
        <li>• Missões treinam um elemento ou jutsu específico</li>
      </ul>
    </InfoBox>

    <SubTitle>Dificuldades</SubTitle>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { name: 'Fácil',   color: 'border-green-500/30 bg-green-500/5',  chakra: '10–30',   xp: 'Baixo',  ryo: 'Baixo' },
        { name: 'Média',   color: 'border-yellow-500/30 bg-yellow-500/5',chakra: '35–70',   xp: 'Médio',  ryo: 'Médio' },
        { name: 'Difícil', color: 'border-orange-500/30 bg-orange-500/5',chakra: '75–150',  xp: 'Alto',   ryo: 'Alto' },
        { name: 'Heróica', color: 'border-red-500/30 bg-red-500/5',      chakra: '160–300', xp: 'Máximo', ryo: 'Máximo' },
      ].map(d => (
        <div key={d.name} className={`rounded-lg border p-3 ${d.color}`}>
          <div className="font-bold text-sm mb-2">{d.name}</div>
          <Row label="Chakra" value={d.chakra} />
          <Row label="XP"     value={d.xp} />
          <Row label="Ryo"    value={d.ryo} />
        </div>
      ))}
    </div>

    <SubTitle>Atualização de Missões (Refresh)</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <div className="font-bold text-sm mb-2">Jogador Free</div>
        <Row label="Refreshes por dia" value="1" />
        <p className="text-xs text-muted-foreground mt-2">Use para trocar missões que não quer realizar.</p>
      </div>
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="font-bold text-sm mb-2 flex items-center gap-2"><Crown className="h-3 w-3 text-yellow-400" /> Premium</div>
        <Row label="Refreshes por dia" value="3" />
        <p className="text-xs text-muted-foreground mt-2">Mais flexibilidade para focar nas missões que mais interessam.</p>
      </div>
    </div>

    <SubTitle>Missões de Clã</SubTitle>
    <InfoBox title="Sistema cooperativo" variant="info">
      <ul className="space-y-1">
        <li>• O clã tem <strong>10 missões compartilhadas</strong>, diferentes das individuais</li>
        <li>• Resetam às <strong>12:00 BRT</strong> diariamente</li>
        <li>• Complete missões de clã para gerar XP de clã e subir o nível</li>
        <li>• Membros de diferentes níveis podem contribuir com a mesma missão</li>
      </ul>
    </InfoBox>
  </div>
);

const TabCacadas = () => (
  <div className="space-y-6">
    <SectionTitle icon={Crosshair}>Caçadas & Batalhas PvP</SectionTitle>

    <SubTitle>Caçadas (Grinding)</SubTitle>
    <p className="text-sm text-muted-foreground">Caçadas são uma forma alternativa de obter Ryo e XP. Você envia seu ninja por um período de tempo e recebe recompensas ao final.</p>
    <InfoBox title="Mecânica das Caçadas" variant="default">
      <ul className="space-y-1">
        <li>• Escolha a duração (de 5 a 60 min. — ou até 2h com Premium)</li>
        <li>• Recompensas fixas: <strong>100 Ryo + 10 XP</strong> por caçada concluída</li>
        <li>• Limite diário: <strong>1 hora</strong> (free) ou <strong>2 horas</strong> (Premium)</li>
        <li>• Não pode fazer missões durante uma caçada ativa</li>
        <li>• Limite reseta às <strong>00:00 BRT</strong> todo dia</li>
      </ul>
    </InfoBox>

    <SubTitle>Busca de Oponente (PvP)</SubTitle>
    <p className="text-sm text-muted-foreground">Desafie outros jogadores em batalhas automáticas por turnos. O sistema encontra adversários de nível próximo ao seu (±2).</p>
    <InfoBox title="Regras do PvP" variant="warning">
      <ul className="space-y-1">
        <li>• Custo: <strong>50 Chakra</strong> por busca</li>
        <li>• Vida mínima para batalhar: <strong>100 HP</strong></li>
        <li>• Cooldown entre buscas: <strong>10 segundos</strong></li>
        <li>• <strong>Vitória:</strong> Ganha 5% do Ryo do oponente + 20 XP</li>
        <li>• <strong>Derrota:</strong> Perde 5% do seu Ryo</li>
        <li>• Dano máximo por golpe: 60% da vida máxima do defensor</li>
      </ul>
    </InfoBox>

    <SubTitle>Como Funciona a Batalha PvP</SubTitle>
    <div className="rounded-lg border p-4 space-y-2 text-xs text-muted-foreground">
      <div className="flex items-start gap-2"><span className="text-primary font-bold min-w-4">1.</span> O sistema detecta a build de cada jogador (2 maiores atributos)</div>
      <div className="flex items-start gap-2"><span className="text-primary font-bold min-w-4">2.</span> Por turno, cada um ataca com Taijutsu, Ninjutsu ou Genjutsu (ponderado pelos atributos)</div>
      <div className="flex items-start gap-2"><span className="text-primary font-bold min-w-4">3.</span> Passivas de build e elementos entram automaticamente</div>
      <div className="flex items-start gap-2"><span className="text-primary font-bold min-w-4">4.</span> Quem ficar com 0 HP primeiro perde</div>
      <div className="flex items-start gap-2"><span className="text-primary font-bold min-w-4">5.</span> Se passar de 50 turnos sem resultado, ganha quem causou mais dano</div>
    </div>
  </div>
);

const TabElementos = () => (
  <div className="space-y-6">
    <SectionTitle icon={Flame}>Elementos</SectionTitle>
    <p className="text-sm text-muted-foreground">Elementos são a base do seu poder ninja. Dominar elementos desbloqueia jutsus poderosos e concede bônus permanentes de atributos. Nível máximo: <strong>10</strong>.</p>

    <SubTitle>Os 5 Elementos</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { emoji: '🔥', name: 'Katon (Fogo)',  color: 'border-orange-500/30 bg-orange-500/5', bonus: '+2 Ninjutsu por nível',    lv10: '20% chance de Queimadura (10% do dano no turno seguinte)', desc: 'Elemento do poder destrutivo. Aumenta a eficácia dos seus jutsus ofensivos.' },
        { emoji: '💨', name: 'Futon (Vento)', color: 'border-green-500/30 bg-green-500/5',   bonus: '+2 Taijutsu por nível',   lv10: '30% chance de segundo ataque (40% dano)',                   desc: 'Elemento da velocidade e corte. Turboalimenta combatentes físicos.' },
        { emoji: '⚡', name: 'Raiton (Raio)', color: 'border-yellow-500/30 bg-yellow-500/5', bonus: '+2 Selo por nível',       lv10: '10% chance de paralisar o oponente',                        desc: 'Elemento da precisão letal. Melhora críticos e pode paralisar inimigos.' },
        { emoji: '🪨', name: 'Doton (Terra)', color: 'border-amber-700/30 bg-amber-700/5',   bonus: '+2 Genjutsu por nível',   lv10: 'Barreira: absorve 50% do primeiro dano (1× por batalha)',    desc: 'Elemento da defesa sólida. Protege de ataques iniciais e fortalece ilusões.' },
        { emoji: '💧', name: 'Suiton (Água)', color: 'border-blue-500/30 bg-blue-500/5',     bonus: '+2 Inteligência por nível',lv10: 'Regenera 5% do HP máximo por turno',                        desc: 'Elemento da adaptação e resistência. Melhora sustentação em batalha.' },
      ].map(el => (
        <div key={el.name} className={`rounded-lg border p-4 ${el.color}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{el.emoji}</span>
            <span className="font-bold text-sm">{el.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{el.desc}</p>
          <Row label="Bônus/nível" value={el.bonus} />
          <Row label="Passiva Lv.10" value={el.lv10} highlight />
        </div>
      ))}
    </div>

    <SubTitle>Como Evoluir Elementos</SubTitle>
    <InfoBox title="Progressão" variant="success">
      <ul className="space-y-1">
        <li>• Evolua elementos completando <strong>Missões</strong> com recompensa elemental</li>
        <li>• Cada missão concede XP a um elemento específico</li>
        <li>• O nível elemental total também é requisito para Dōjutsu e Selo Amaldiçoado</li>
        <li>• Quanto maior o nível do elemento, mais jutsus você desbloqueia</li>
      </ul>
    </InfoBox>
  </div>
);

const TabJutsus = () => (
  <div className="space-y-6">
    <SectionTitle icon={ScrollText}>Jutsus</SectionTitle>
    <p className="text-sm text-muted-foreground">Jutsus são as técnicas que seu ninja usa em batalha. Cada jutsu pertence a um elemento e tem nível que aumenta com missões. Nível máximo: <strong>25</strong>.</p>

    <SubTitle>Lista Completa de Jutsus</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { emoji: '🔥', element: 'Katon',  color: 'border-orange-500/20', jutsus: [
          { name: 'Katon: Hōsenka no Jutsu',  req: 'Lv.1' },
          { name: 'Katon: Gōkakyū no Jutsu',  req: 'Lv.4' },
          { name: 'Katon: Gōryūka no Jutsu',  req: 'Lv.6' },
          { name: 'Katon: Haisekishō',         req: 'Lv.8' },
          { name: 'Katon: Endan',              req: 'Lv.10' },
        ]},
        { emoji: '💨', element: 'Futon',  color: 'border-green-500/20', jutsus: [
          { name: 'Futon: Atsugai',            req: 'Lv.1' },
          { name: 'Futon: Daitoppa',           req: 'Lv.4' },
          { name: 'Futon: Shinkūha',           req: 'Lv.6' },
          { name: 'Futon: Rasenshuriken',      req: 'Lv.8' },
          { name: 'Futon: Shinkū Renpa',       req: 'Lv.10' },
        ]},
        { emoji: '⚡', element: 'Raiton', color: 'border-yellow-500/20', jutsus: [
          { name: 'Raiton: Kuroi Panther',     req: 'Lv.1' },
          { name: 'Raiton: Raijū Tsuiga',      req: 'Lv.4' },
          { name: 'Raiton: Senbon Chidori',    req: 'Lv.6' },
          { name: 'Raiton: Liger Bomb',        req: 'Lv.8' },
          { name: 'Raiton: Kirin',             req: 'Lv.10' },
        ]},
        { emoji: '🪨', element: 'Doton',  color: 'border-amber-700/20', jutsus: [
          { name: 'Doton: Arijigoku',          req: 'Lv.1' },
          { name: 'Doton: Doryūtaiga',         req: 'Lv.4' },
          { name: 'Doton: Doryūheki',          req: 'Lv.6' },
          { name: 'Doton: Sando',              req: 'Lv.8' },
          { name: 'Doton: Doryūdan',           req: 'Lv.10' },
        ]},
        { emoji: '💧', element: 'Suiton', color: 'border-blue-500/20',   jutsus: [
          { name: 'Suiton: Bakusui Shōha',     req: 'Lv.1' },
          { name: 'Suiton: Daibaku no Jutsu',  req: 'Lv.4' },
          { name: 'Suiton: Goshokuzame',       req: 'Lv.6' },
          { name: 'Suiton: Suijinheki',        req: 'Lv.8' },
          { name: 'Suiton: Suiryūdan no Jutsu',req: 'Lv.10' },
        ]},
      ].map(group => (
        <div key={group.element} className={`rounded-lg border p-4 ${group.color}`}>
          <div className="font-bold text-sm mb-3">{group.emoji} {group.element}</div>
          {group.jutsus.map(j => (
            <div key={j.name} className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
              <span className="text-muted-foreground">{j.name}</span>
              <Badge variant="outline" className="text-[10px] h-4">{j.req}</Badge>
            </div>
          ))}
        </div>
      ))}
    </div>

    <SubTitle>Limite de Jutsus</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <div className="font-bold text-sm mb-2">Jogador Free</div>
        <p className="text-muted-foreground text-xs">Até <strong>3 jutsus por elemento</strong> (15 no total)</p>
      </div>
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="font-bold text-sm mb-2 flex items-center gap-2"><Crown className="h-3 w-3 text-yellow-400" /> Premium</div>
        <p className="text-muted-foreground text-xs">Até <strong>5 jutsus por elemento</strong> (25 no total)</p>
      </div>
    </div>

    <InfoBox title="⚙️ Como o Nível de Jutsu Funciona em Batalha" variant="info">
      <p>Durante batalhas de Ninjutsu, o dano é calculado com um multiplicador de jutsu: <strong>jutsuMult = 1 + (nível ^ 0.85) × 0.06</strong>, limitado a ×1.78 (ou ×2.2 para a build Feiticeiro). Isso significa que jutsus de nível 25 causam bem mais dano que os de nível 1.</p>
    </InfoBox>
  </div>
);

const TabEquipamentos = () => (
  <div className="space-y-6">
    <SectionTitle icon={Grip}>Equipamentos</SectionTitle>
    <p className="text-sm text-muted-foreground">Equipamentos fornecem bônus de atributos que se somam aos seus pontos distribuídos. São divididos em quatro categorias.</p>

    <SubTitle>Armas</SubTitle>
    <InfoBox title="Slot único — Dano e atributos ofensivos" variant="default">
      <ul className="space-y-1">
        <li>• Apenas <strong>1 arma equipada</strong> por vez</li>
        <li>• Compre na aba <strong>Armas</strong> com Ryo</li>
        <li>• Venda por <strong>50% do valor original</strong></li>
        <li>• Algumas armas são exclusivas para Premium (ícone 👑)</li>
      </ul>
    </InfoBox>

    <SubTitle>Invocações</SubTitle>
    <InfoBox title="Contrato com criaturas lendárias — bônus de atributos + treinamento" variant="info">
      <ul className="space-y-1">
        <li>• Apenas <strong>1 contrato ativo</strong> por vez</li>
        <li>• Invocações têm bônus base em múltiplos atributos</li>
        <li>• Sistema de <strong>treinamento</strong>: escolha 1 atributo para potencializar (+2 por nível de treino, até nível 10)</li>
        <li>• Mudar o atributo treinado <strong>reseta</strong> os pontos para o novo atributo</li>
      </ul>
    </InfoBox>

    <SubTitle>Armaduras (Arsenal)</SubTitle>
    <InfoBox title="4 slots de armadura — Peito, Pernas, Pés e Mãos" variant="success">
      <p>Cada peça fornece bônus de atributos distintos. Complete os 4 slots para máximo poder defensivo. Compre na aba <strong>Equipamentos</strong>.</p>
    </InfoBox>

    <SubTitle>Como os Bônus São Calculados</SubTitle>
    <div className="rounded-lg border p-4 text-xs text-muted-foreground space-y-2">
      <p>O stat final é a soma de:</p>
      {[
        'Atributo base distribuído',
        'Bônus da Arma',
        'Bônus da Invocação + treinamento',
        'Bônus das Peças de Armadura (×4)',
        'Bônus dos Elementos (+2 por nível)',
        'Multiplicadores de Dōjutsu / Selo Amaldiçoado (se ativos)',
        'Bônus de Pontos de Guerra do Clã (√pontos × 2, máx +63)',
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
          <span>{item}</span>
        </div>
      ))}
    </div>

    <SubTitle>Passivas de Equipamentos</SubTitle>
    <p className="text-xs text-muted-foreground mb-3">
      Além dos bônus de stats, cada peça de armadura possui <strong>passivas</strong> que se ativam em combate com base em um gatilho e uma chance. Elas se acumulam com as passivas de armas e builds.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        { emoji: '🛡️', name: 'Barreira',      color: 'border-green-500/20 bg-green-500/5',   desc: 'Cria uma barreira que absorve parte do dano recebido naquele golpe. Ativada ao receber dano ou no início do turno. Chance varia de 10% (Genin) a 35% (Elite).' },
        { emoji: '💥', name: 'Refletir',       color: 'border-orange-500/20 bg-orange-500/5', desc: 'Devolve uma porcentagem do dano recebido ao atacante. Chance de 15%–30%. Valor refletido: 10%–20% do dano.' },
        { emoji: '🌿', name: 'Regeneração',    color: 'border-emerald-500/20 bg-emerald-500/5',desc: 'Recupera % do HP máximo no início de cada turno. Vai de 1% (Calça Reforçada) a 4% (Manto de Senjutsu).' },
        { emoji: '⚡', name: 'Paralisia',      color: 'border-yellow-500/20 bg-yellow-500/5', desc: 'Paralisa o alvo ao atacar, fazendo-o perder o próximo turno. Ativada por Taijutsu ou em ataques gerais. Chance de 20%–30%.' },
        { emoji: '🔮', name: 'Selar Jutsu',    color: 'border-purple-500/20 bg-purple-500/5', desc: 'Sela o Ninjutsu do alvo por 1 turno, impedindo que ele use jutsus elementais. Ativada por Genjutsu ou Ninjutsu.' },
        { emoji: '🌑', name: 'Enfraquecer',    color: 'border-rose-500/20 bg-rose-500/5',     desc: 'Aplica fraqueza no alvo: ele recebe mais dano no próximo turno. Ativada por Taijutsu, Genjutsu ou qualquer ataque.' },
        { emoji: '🌑', name: 'Veneno',         color: 'border-lime-500/20 bg-lime-500/5',     desc: 'Envenena o alvo — ele sofre dano fixo no início do próximo turno (6%–7% do HP máximo). Ativada por Taijutsu ou Genjutsu.' },
        { emoji: '💪', name: 'Lifesteal',      color: 'border-pink-500/20 bg-pink-500/5',     desc: 'Rouba HP ao usar Taijutsu — recupera de 5% a 12% do dano causado como vida. Exclusivo de luvas/manoplas.' },
        { emoji: '🌀', name: 'Ignorar Cap',    color: 'border-indigo-500/20 bg-indigo-500/5', desc: 'O próximo ataque ignora o cap de 60% de dano por golpe. Ativada por Ninjutsu ou Taijutsu, chance 15%–35%.' },
      ].map(p => (
        <div key={p.name} className={`rounded-lg border p-3 ${p.color}`}>
          <div className="font-bold text-sm mb-1">{p.emoji} {p.name}</div>
          <p className="text-xs text-muted-foreground">{p.desc}</p>
        </div>
      ))}
    </div>

    <SubTitle>Armaduras — Bônus por Peça (visão geral)</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { slot: '🎽 Peito', color: 'border-red-500/20 bg-red-500/5', items: [
          { name: 'Colete Genin',         req: 'Nv.1',  price: '10k',   buffs: '+5 Vit' },
          { name: 'Colete Chūnin',        req: 'Nv.15', price: '25k',   buffs: '+15 Vit, +2 Tai' },
          { name: 'Colete Jōnin',         req: 'Nv.30', price: '80k',   buffs: '+25 Vit, +5 Tai/Nin/Sel/Int' },
          { name: 'Manto da Akatsuki',    req: 'Nv.40', price: '150k',  buffs: '+10 Vit, +20 Nin, +10 Gen' },
          { name: 'Armadura ANBU',        req: 'Nv.45', price: '180k',  buffs: '+35 Vit, +5 em tudo' },
          { name: 'Manto de Senjutsu',    req: 'Nv.55', price: '300k',  buffs: '+20 Vit, +25 Nin, +15 Gen, +10 Sel/Int' },
          { name: 'Armadura de Kage',     req: 'Nv.65', price: '500k',  buffs: '+50 Vit, +10 em tudo' },
          { name: 'Manto Chakra Denso',   req: 'Nv.75', price: '750k',  buffs: '+25 Vit, +35 Nin, +25 Gen, +15 Sel/Int' },
          { name: 'Armadura Elite Ninja', req: 'Nv.90', price: '2M',    buffs: '+70 Vit, +20 em tudo' },
        ]},
        { slot: '👖 Pernas', color: 'border-blue-500/20 bg-blue-500/5', items: [
          { name: 'Calça Reforçada',       req: 'Nv.10', price: '15k',   buffs: '+8 Vit, +2 Tai' },
          { name: 'Calça Fluxo Chakra',    req: 'Nv.20', price: '50k',   buffs: '+2 Vit, +8 Nin, +5 Sel' },
          { name: 'Calça ANBU',            req: 'Nv.30', price: '90k',   buffs: '+15 Vit, +5 Tai/Nin, +5 Sel' },
          { name: 'Calça Movimento Rápido',req: 'Nv.40', price: '160k',  buffs: '+5 Vit, +12 Tai, +5 Sel' },
          { name: 'Calça Controle Chakra', req: 'Nv.55', price: '320k',  buffs: '+10 Vit, +15 Nin, +5 Gen, +10 Sel, +5 Int' },
          { name: 'Calça de Kage',         req: 'Nv.70', price: '600k',  buffs: '+25 Vit, +10 Tai/Nin/Gen/Sel, +5 Int' },
          { name: 'Calça Controle Avançado',req:'Nv.85', price: '1.3M',  buffs: '+35 Vit, +20 Tai/Nin, +10 Gen, +15 Sel, +10 Int' },
        ]},
        { slot: '👟 Pés', color: 'border-green-500/20 bg-green-500/5', items: [
          { name: 'Sandálias Ninja',       req: 'Nv.1',  price: '10k',   buffs: '+2 Tai, +2 Sel' },
          { name: 'Botas Mov. Rápido',     req: 'Nv.25', price: '70k',   buffs: '+8 Tai, +5 Sel' },
          { name: 'Botas ANBU',            req: 'Nv.30', price: '90k',   buffs: '+5 Vit, +8 Tai, +5 Nin/Sel' },
          { name: 'Botas Impulso Raiton',  req: 'Nv.45', price: '180k',  buffs: '+15 Tai, +5 Nin/Sel' },
          { name: 'Botas de Infiltração',  req: 'Nv.60', price: '400k',  buffs: '+5 Vit, +10 Tai/Nin/Gen, +5 Sel/Int' },
          { name: 'Botas de Kage',         req: 'Nv.75', price: '750k',  buffs: '+15 Vit, +20 Tai, +10 Nin/Gen, +10 Sel, +5 Int' },
          { name: 'Botas Alta Velocidade', req: 'Nv.90', price: '1.5M',  buffs: '+20 Vit, +30 Tai, +20 Nin, +15 Gen, +15 Sel, +10 Int' },
        ]},
        { slot: '🥊 Mãos', color: 'border-yellow-500/20 bg-yellow-500/5', items: [
          { name: 'Luvas Ninja',           req: 'Nv.5',  price: '12k',   buffs: '+3 Tai' },
          { name: 'Braçadeiras Defensivas',req: 'Nv.18', price: '45k',   buffs: '+10 Vit, –2 Tai' },
          { name: 'Luvas ANBU',            req: 'Nv.30', price: '90k',   buffs: '+5 Vit, +8 Tai, +5 Nin/Sel' },
          { name: 'Luvas Concentração',    req: 'Nv.45', price: '200k',  buffs: '+10 Tai, +15 Nin, +10 Sel, +5 Int' },
          { name: 'Manoplas Selos',        req: 'Nv.60', price: '420k',  buffs: '+5 Vit, +15 Nin/Gen/Sel, +10 Int' },
          { name: 'Manoplas de Kage',      req: 'Nv.75', price: '800k',  buffs: '+15 Vit, +15 Tai/Nin/Gen, +10 Sel/Int' },
          { name: 'Manoplas Combate Av.',  req: 'Nv.90', price: '1.6M',  buffs: '+25 Vit, +30 Tai, +25 Nin, +20 Gen, +20 Sel, +15 Int' },
        ]},
      ].map(slot => (
        <div key={slot.slot} className={`rounded-lg border p-4 ${slot.color}`}>
          <div className="font-bold text-sm mb-3">{slot.slot}</div>
          {slot.items.map(item => (
            <div key={item.name} className="flex justify-between items-start py-1 border-b border-border/20 last:border-0 gap-2">
              <div>
                <div className="text-xs font-medium">{item.name}</div>
                <div className="text-[10px] text-muted-foreground">{item.req} · {item.price} Ryo</div>
              </div>
              <span className="text-[10px] text-green-400 text-right whitespace-nowrap">{item.buffs}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const TabCla = () => (
  <div className="space-y-6">
    <SectionTitle icon={Users}>Clãs</SectionTitle>
    <p className="text-sm text-muted-foreground">Clãs são grupos de jogadores que cooperam para evoluir juntos. Membros do clã recebem bônus de tecnologias que ficam ativos permanentemente, além de participar das Guerras 5v5.</p>

    <SubTitle>Criar ou Entrar em um Clã</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <div className="font-bold text-sm mb-2">Criar Clã</div>
        <Row label="Custo"         value="10.000 Ryo" highlight />
        <Row label="Nome"          value="3–20 caracteres" />
        <Row label="Tag"           value="2–4 caracteres" />
        <Row label="Papel inicial" value="Líder" />
      </div>
      <div className="rounded-lg border p-4">
        <div className="font-bold text-sm mb-2">Entrar em um Clã</div>
        <p className="text-xs text-muted-foreground">Solicite entrada em um clã existente. Um Líder ou Conselheiro precisa aceitar.</p>
        <div className="mt-2 text-xs"><span className="font-medium">Papéis:</span> Líder / Conselheiro / Membro</div>
      </div>
    </div>

    <SubTitle>Limite de Membros</SubTitle>
    <InfoBox title="Slots de membros aumentam com o nível do clã" variant="info">
      <p>Fórmula: <strong>5 + (nível do clã – 1)</strong>, máximo de <strong>30 membros</strong>.</p>
      <p className="mt-1 text-xs">Clã nível 1 = 5 membros | Clã nível 10 = 14 membros | Clã nível 26+ = 30 membros</p>
    </InfoBox>

    <SubTitle>Tecnologias do Clã</SubTitle>
    <p className="text-xs text-muted-foreground mb-3">O clã possui 3 estruturas que podem ser melhoradas com Ryo do cofre. Cada melhoria beneficia <strong>todos os membros</strong> automaticamente.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: '🏥', name: 'Hospital do Clã',  color: 'border-red-500/20 bg-red-500/5',       levels: ['Lv.1 (500k Ryo): +10% regen de chakra', 'Lv.3: Poções 20% mais eficientes', 'Lv.5: –20% cooldown de Dōjutsu/Selo'] },
        { icon: '🥋', name: 'Dojo do Clã',      color: 'border-green-500/20 bg-green-500/5',   levels: ['Lv.1 (500k Ryo): +5% XP em missões', 'Lv.3: +15% XP em missões (total)', 'Lv.4: +10% XP de elementos | Lv.5: +10% XP de jutsus'] },
        { icon: '💰', name: 'Tesouro do Clã',   color: 'border-yellow-500/20 bg-yellow-500/5', levels: ['Lv.1 (500k Ryo): +5% Ryo em missões', 'Lv.3: 3% desconto nas lojas', 'Lv.4/5: 5% desconto (total)'] },
      ].map(tech => (
        <div key={tech.name} className={`rounded-lg border p-4 ${tech.color}`}>
          <div className="font-bold text-sm mb-3">{tech.icon} {tech.name}</div>
          {tech.levels.map((l, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-1 py-1 border-b border-border/20 last:border-0">
              <span className="text-primary mt-0.5">•</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
      ))}
    </div>

    <SubTitle>Doações ao Clã</SubTitle>
    <InfoBox title="Financie as tecnologias do seu clã" variant="default">
      <p>Membros podem doar Ryo ao cofre do clã. O cofre é usado exclusivamente para comprar upgrades de tecnologia. Quanto mais membros doarem, mais rápido o clã evolui.</p>
    </InfoBox>
  </div>
);

const TabGuerra = () => (
  <div className="space-y-6">
    <SectionTitle icon={Shield}>Guerra de Clãs 5v5</SectionTitle>
    <p className="text-sm text-muted-foreground">
      A Guerra de Clãs é o modo de batalha competitivo em equipe. Dois clãs se enfrentam em combate tático por turnos com <strong>5 jogadores de cada lado</strong>. Cada turno dura <strong>30 segundos</strong> para todos escolherem suas ações.
    </p>

    <SubTitle>Como Funciona</SubTitle>
    <div className="rounded-lg border p-4 space-y-2 text-xs text-muted-foreground">
      {[
        'O Líder do clã abre uma sala de guerra (10 salas disponíveis)',
        'Convida 4 membros para completar o time de 5',
        'Um clã adversário aceita o desafio e monta seu time',
        'Quando ambos os times estão completos, a batalha começa',
        'Cada turno: todos os jogadores escolhem uma ação em 30s',
        'As ações são resolvidas simultaneamente ao final do turno',
        'A guerra termina quando todos de um time são eliminados',
      ].map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-primary font-bold min-w-5">{i + 1}.</span>
          <span>{step}</span>
        </div>
      ))}
    </div>

    <SubTitle>Ações em Batalha</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        { action: '⚔️ Taijutsu',    cd: '2 turnos', cost: 'Grátis',  desc: 'Ataque físico em um inimigo. Usa stat Taijutsu.' },
        { action: '🔥 Ninjutsu',    cd: '3 turnos', cost: '30 chakra', desc: 'Jutsu elemental. Usa Ninjutsu + elemento + jutsu.' },
        { action: '👁️ Genjutsu',    cd: '2 turnos', cost: '25 chakra', desc: 'Ilusão. Pode ser resistida pela Inteligência.' },
        { action: '🛡️ Defender',    cd: '2 turnos', cost: '10 chakra', desc: 'Reduz o dano recebido neste turno.' },
        { action: '⚡ Carregar',    cd: 'Sem CD',   cost: 'Grátis',  desc: 'Recupera chakra. Sempre disponível.' },
        { action: '👁️‍🗨️ Dōjutsu',    cd: '1× batalha',cost: 'Grátis', desc: 'Usa seu poder ocular. Disponível 1× por batalha.' },
        { action: '☠️ Selo Amald.', cd: '1× batalha',cost: 'Grátis', desc: 'Ativa o selo amaldiçoado. Disponível 1× por batalha.' },
        { action: '🐉 Invocação',   cd: '1× batalha',cost: '50 chakra',desc: 'Invoca sua criatura. Disponível 1× por batalha.' },
      ].map(a => (
        <div key={a.action} className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm">{a.action}</span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[9px] h-4">{a.cd}</Badge>
              <Badge variant="outline" className="text-[9px] h-4 text-blue-400 border-blue-400/30">{a.cost}</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{a.desc}</p>
        </div>
      ))}
    </div>

    <SubTitle>Mecânicas Especiais da Guerra</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="font-bold text-sm mb-2">🎯 Limite de 2 Atacantes por Alvo</div>
        <p className="text-xs text-muted-foreground">A interface bloqueia selecionar um alvo que já tem <strong>2 jogadores aliados</strong> mirando nele. Isso incentiva distribuição de alvos. A restrição <strong>desaparece automaticamente quando restam 2 ou menos inimigos vivos</strong>. O contador <span className="text-yellow-400 font-bold">1/2</span> ou <span className="text-orange-400 font-bold">2/2</span> aparece sobre cada inimigo.</p>
      </div>
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="font-bold text-sm mb-2">💥 Bônus de Foco</div>
        <p className="text-xs text-muted-foreground">Se <strong>3 ou mais jogadores</strong> do mesmo time atacarem o mesmo alvo no mesmo turno, todos causam <strong>+20% de dano</strong>. Isso se aplica mesmo com o limite de 2 da UI — a restrição de 2 é visual (UI), mas o engine conta todos os ataques ao resolver o turno.</p>
      </div>
      <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-4">
        <div className="font-bold text-sm mb-2">⚖️ Dano sem Modificador de Time</div>
        <p className="text-xs text-muted-foreground">O número de aliados vivos <strong>não altera o dano</strong> — cada jogador sempre causa seu dano normal, independente de quantos membros do time estão vivos.</p>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="font-bold text-sm mb-2">⏳ Inatividade e Ação Automática</div>
        <p className="text-xs text-muted-foreground">Jogador sem ação no turno: sistema executa ação ofensiva automática no inimigo com <strong>menos HP</strong>. O contador de inatividade sobe (+1 por turno). Com <strong>3 turnos consecutivos sem agir</strong>, o jogador é eliminado com HP=0 e o clã perde <strong>–1 ponto de guerra</strong>. O aviso aparece no log da batalha.</p>
      </div>
    </div>

    <SubTitle>Sistema de Pontuação</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <div className="font-bold text-sm mb-3 text-green-400">🏆 Clã Vencedor</div>
        <Row label="Base"                        value="+5 pontos" highlight />
        <Row label="2+ aliados vivos ao fim"     value="+1 ponto" />
        <Row label="MVP (mais dano da batalha)"  value="+1 ponto" />
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="font-bold text-sm mb-3 text-red-400">💔 Clã Perdedor</div>
        <Row label="Base"                           value="–5 pontos" highlight />
        <Row label="Nenhum inimigo eliminado"       value="–1 ponto adicional" />
        <Row label="Pior dano (menos dano da batalha)" value="–1 ponto" />
      </div>
    </div>
    <InfoBox title="📊 Pontos vão para o Ranking Geral (nunca reseta)" variant="info">
      <ul className="space-y-1">
        <li>• Os <strong>Pontos de Guerra</strong> do clã acumulam para sempre no ranking geral</li>
        <li>• Também são contabilizados separadamente nas <strong>Ligas Semanal e Mensal</strong></li>
        <li>• Pontos de Guerra do clã dão bônus de atributos a todos os membros: <strong>√pontos × 2</strong></li>
        <li>• Mínimo: 0 pontos (nunca fica negativo)</li>
      </ul>
    </InfoBox>

    <SubTitle>Liga Semanal e Mensal</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="font-bold text-sm mb-3">📅 Liga Semanal</div>
        <p className="text-xs text-muted-foreground mb-2">Ranking independente que reseta toda <strong>segunda-feira</strong>. Os 3 melhores clãs da semana ganham Ryo para o cofre do clã.</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-yellow-400">🥇 1º lugar</span><span>10.000 Ryo + 500 XP</span></div>
          <div className="flex justify-between"><span className="text-slate-400">🥈 2º lugar</span><span>5.000 Ryo + 250 XP</span></div>
          <div className="flex justify-between"><span className="text-amber-600">🥉 3º lugar</span><span>2.500 Ryo + 100 XP</span></div>
        </div>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="font-bold text-sm mb-3">🏆 Liga Mensal</div>
        <p className="text-xs text-muted-foreground mb-2">Ranking que reseta no <strong>início de cada mês</strong>. Prêmios maiores que o semanal.</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-yellow-400">👑 1º lugar</span><span>50.000 Ryo + 2.000 XP</span></div>
          <div className="flex justify-between"><span className="text-slate-400">🏆 2º lugar</span><span>25.000 Ryo + 1.000 XP</span></div>
          <div className="flex justify-between"><span className="text-amber-600">🎖️ 3º lugar</span><span>10.000 Ryo + 500 XP</span></div>
        </div>
      </div>
    </div>

    <SubTitle>Espectadores</SubTitle>
    <InfoBox title="👁️ Assista guerras ao vivo" variant="default">
      <ul className="space-y-1">
        <li>• Qualquer jogador pode espectrar uma guerra ativa clicando em <strong>👁️ Espectrar</strong></li>
        <li>• Máximo de <strong>5 espectadores</strong> por sala simultaneamente</li>
        <li>• Espectadores veem HP, chakra e o log de turnos já resolvidos</li>
        <li>• Espectadores são removidos automaticamente quando a guerra termina</li>
      </ul>
    </InfoBox>
  </div>
);

const TabInvasao = () => (
  <div className="space-y-6">
    <SectionTitle icon={ShieldAlert}>Invasão Global</SectionTitle>
    <p className="text-sm text-muted-foreground">A Invasão é um evento global onde <strong>todos os jogadores</strong> atacam o mesmo Boss em conjunto. O boss tem milhões de HP e só é derrotado com a cooperação de toda a comunidade.</p>

    <SubTitle>Regras Gerais</SubTitle>
    <InfoBox title="Mecânica do Boss" variant="danger">
      <ul className="space-y-1">
        <li>• Um novo Boss aparece <strong>semanalmente</strong></li>
        <li>• Após ser derrotado, o próximo respawna em <strong>24 horas</strong></li>
        <li>• Cada jogador pode atacar com cooldown de <strong>10 minutos</strong></li>
        <li>• Não há cap de 35% — o dano total é ilimitado</li>
        <li>• Bosses têm de 2.000.000 a 10.000.000+ de HP</li>
      </ul>
    </InfoBox>

    <SubTitle>Bosses Disponíveis (22 no total)</SubTitle>
    <p className="text-xs text-muted-foreground mb-3">O boss de cada semana é sorteado aleatoriamente entre os 22 disponíveis.</p>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {[
        { name: 'Zetsu',                          hp: '2.000.000', level: '92' },
        { name: 'Hidan',                          hp: '2.000.000', level: '94' },
        { name: 'Konan',                          hp: '3.000.000', level: '95' },
        { name: 'Deidara',                        hp: '3.000.000', level: '96' },
        { name: 'Sasori da Areia Vermelha',       hp: '3.000.000', level: '96' },
        { name: 'Kisame Hoshigaki',               hp: '3.000.000', level: '97' },
        { name: 'Tsunade (Quinta Hokage)',         hp: '3.000.000', level: '97' },
        { name: 'Mei Terumī (Quinta Mizukage)',    hp: '3.000.000', level: '97' },
        { name: 'Ōnoki (Terceiro Tsuchikage)',     hp: '4.000.000', level: '98' },
        { name: 'Hiruzen Sarutobi (Terceiro Hokage)',hp:'4.000.000',level: '98' },
        { name: 'Gaara (Quinto Kazekage)',         hp: '4.000.000', level: '98' },
        { name: 'Kakuzu',                          hp: '4.000.000', level: '98' },
        { name: 'A (Quarto Raikage)',              hp: '4.000.000', level: '98' },
        { name: 'Itachi Uchiha',                  hp: '4.000.000', level: '99' },
        { name: 'Tobirama Senju',                 hp: '4.000.000', level: '99' },
        { name: 'Mū',                             hp: '4.000.000', level: '99' },
        { name: 'Pain (Caminho Deva)',             hp: '4.500.000', level: '100' },
        { name: 'Tobi (Obito Uchiha)',            hp: '4.500.000', level: '100' },
        { name: 'Minato Namikaze',                hp: '4.500.000', level: '100' },
        { name: 'Madara Uchiha (Jinchūriki)',     hp: '5.000.000', level: '100' },
        { name: 'Hashirama Senju',                hp: '5.000.000', level: '100' },
        { name: 'Kaguya Ōtsutsuki',              hp: '5.500.000', level: '100' },
      ].map(boss => (
        <div key={boss.name} className={`rounded-lg border p-3 text-xs ${
          boss.hp === '5.500.000' ? 'border-yellow-500/40 bg-yellow-500/5' :
          boss.hp === '5.000.000' ? 'border-red-500/30 bg-red-500/5' :
          boss.hp === '4.500.000' ? 'border-purple-500/30 bg-purple-500/5' :
          boss.hp === '4.000.000' ? 'border-orange-500/20 bg-orange-500/5' :
          'border-border/40'
        }`}>
          <div className="font-bold leading-tight">{boss.name}</div>
          <div className="text-muted-foreground mt-1">Nv. {boss.level}</div>
          <div className="text-muted-foreground">{boss.hp} HP</div>
        </div>
      ))}
    </div>

    <SubTitle>Marcos de Dano (Milestones)</SubTitle>
    <p className="text-xs text-muted-foreground mb-2">Ao atingir certos patamares de dano acumulado no Boss, você recebe Ryo automaticamente.</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
      {[
        { dmg: '10k',  ryo: '500' },    { dmg: '25k',  ryo: '1.200' }, { dmg: '50k', ryo: '2.500' },
        { dmg: '75k',  ryo: '4.000' },  { dmg: '100k', ryo: '6.000' }, { dmg: '150k',ryo: '9.000' },
        { dmg: '200k', ryo: '12.500' }, { dmg: '300k', ryo: '18.000' },{ dmg: '500k',ryo: '30.000' },
        { dmg: '750k', ryo: '45.000' }, { dmg: '1M',   ryo: '65.000', highlight: true },
      ].map(m => (
        <div key={m.dmg} className={`rounded border p-2 flex justify-between items-center ${(m as any).highlight ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border/30'}`}>
          <span className="font-medium">{m.dmg}</span>
          <span className="text-green-400">+{m.ryo} Ryo</span>
        </div>
      ))}
    </div>

    <SubTitle>Recompensas ao Derrotar o Boss</SubTitle>
    <InfoBox title="Recompensas exclusivas para quem dar o golpe final" variant="success">
      <ul className="space-y-1">
        <li>• <strong>+100.000 Ryo</strong> para quem matar o boss</li>
        <li>• <strong>+10 Pontos de Atributo</strong> somente para quem der o golpe final</li>
      </ul>
    </InfoBox>

    <SubTitle>Sistema de Drops</SubTitle>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-gray-500/20 p-3">
        <div className="font-bold text-sm mb-2">⚪ Comum</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>📜 Pergaminho de XP Pequeno</li><li>💰 Bolsa de Ryo (2.000)</li>
          <li>🧴 Pomada Medicinal (+30% HP)</li><li>⚗️ Tônico de Chakra (+25%)</li>
          <li>🏋️ Pesos de Treino (+15% XP por 24h)</li><li>🧿 Amuleto da Fortuna (+20% Ryo por 24h)</li>
        </ul>
      </div>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="font-bold text-sm mb-2 text-blue-400">🔵 Raro</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>💊 Pílula de Aprimoramento (+3 pontos)</li><li>📖 Pergaminho Elemental (+200 XP elem.)</li>
          <li>📜 Pergaminho de XP Médio</li><li>💰 Bolsa de Ryo Grande (8.000)</li>
          <li>📕 Manual de Refinamento de Jutsu (+500 XP)</li>
        </ul>
      </div>
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
        <div className="font-bold text-sm mb-2 text-purple-400">💜 Épico</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>📜 Pergaminho de XP Grande</li>
          <li>📚 Manual do Mestre (+2 em 2 atributos)</li>
        </ul>
      </div>
    </div>
  </div>
);

const TabPoderes = () => (
  <div className="space-y-6">
    <SectionTitle icon={Eye}>Poderes Especiais</SectionTitle>

    <SubTitle>Dōjutsu (Poderes Oculares)</SubTitle>
    <p className="text-sm text-muted-foreground mb-4">Poderes oculares lendários que multiplicam seus atributos quando ativados. Existem dois caminhos, cada um com 3 evoluções. A escolha é permanente.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="font-bold mb-3">👁️ Caminho Sharingan</div>
        {[
          { name: 'Sharingan',           req: 'Nv.20 + 10 nível elem. total', bonus: '+5% Ninjutsu, +5% Genjutsu' },
          { name: 'Mangekyō Sharingan',  req: 'Nv.40 + 25 nível elem. total', bonus: '+15% Ninjutsu, +15% Genjutsu' },
          { name: 'Rinnegan',            req: 'Nv.60 + 50 nível elem. total', bonus: '+30% Ninjutsu, +30% Genjutsu' },
        ].map(d => (
          <div key={d.name} className="py-2 border-b border-border/20 last:border-0">
            <div className="font-medium text-sm">{d.name}</div>
            <div className="text-xs text-muted-foreground">{d.req}</div>
            <div className="text-xs text-green-400">{d.bonus}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">
        <div className="font-bold mb-3">🔮 Caminho Byakugan</div>
        {[
          { name: 'Byakugan',  req: 'Nv.20 + 10 nível elem. total', bonus: '+5% Taijutsu, +5% Inteligência' },
          { name: 'Tenseigan', req: 'Nv.40 + 25 nível elem. total', bonus: '+15% Taijutsu, +15% Inteligência' },
          { name: 'Jōgan',     req: 'Nv.60 + 50 nível elem. total', bonus: '+30% Taijutsu, +30% Inteligência' },
        ].map(d => (
          <div key={d.name} className="py-2 border-b border-border/20 last:border-0">
            <div className="font-medium text-sm">{d.name}</div>
            <div className="text-xs text-muted-foreground">{d.req}</div>
            <div className="text-xs text-green-400">{d.bonus}</div>
          </div>
        ))}
      </div>
    </div>

    <InfoBox title="⚠️ Regras do Dōjutsu" variant="warning">
      <ul className="space-y-1">
        <li>• Consome <strong>1 Chakra por segundo</strong> enquanto ativo</li>
        <li>• Cooldown de <strong>1 hora</strong> após desativar</li>
        <li>• Não pode distribuir pontos de atributo com Dōjutsu ativo</li>
        <li>• A escolha de caminho (Sharingan ou Byakugan) é <strong>permanente</strong></li>
        <li>• Na Guerra de Clãs: disponível <strong>1× por batalha</strong></li>
      </ul>
    </InfoBox>

    <SubTitle>Selo Amaldiçoado</SubTitle>
    <p className="text-sm text-muted-foreground mb-3">O Selo é um poder de alto risco e alta recompensa. Ao ativá-lo, seus atributos ofensivos aumentam massivamente mas sua vida máxima cai. O processo de obter ou evoluir o selo é perigoso — pode deixar você quase morto.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
        <div className="font-bold text-sm mb-3">🔮 Nível 1</div>
        <Row label="Requisito nível"     value="Nv. 30" />
        <Row label="Nível elem. total"   value="≥ 15" />
        <Row label="Custo"               value="10.000 Ryo" />
        <Row label="Chance de sucesso"   value="25%" highlight />
        <Row label="Falha"               value="Fica quase morto + perde Ryo" />
        <div className="mt-3 space-y-1 text-xs">
          <div className="text-green-400">+20% Ninjutsu | +20% Taijutsu | +15% Selo</div>
          <div className="text-red-400">–15% Vida Máxima</div>
        </div>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="font-bold text-sm mb-3">☠️ Nível 2</div>
        <Row label="Requisito"           value="Selo Nv.1 já obtido" />
        <Row label="Nível elem. total"   value="≥ 30" />
        <Row label="Custo"               value="30.000 Ryo" />
        <Row label="Chance de sucesso"   value="25%" highlight />
        <Row label="Falha"               value="Fica quase morto + perde Ryo" />
        <div className="mt-3 space-y-1 text-xs">
          <div className="text-green-400">+40% Ninjutsu | +40% Taijutsu | +30% Selo</div>
          <div className="text-red-400">–30% Vida Máxima</div>
        </div>
      </div>
    </div>

    <InfoBox title="Duração e Cooldown" variant="info">
      <ul className="space-y-1">
        <li>• <strong>Duração ativa:</strong> 30 minutos</li>
        <li>• <strong>Cooldown:</strong> 24 horas após uso</li>
        <li>• O selo não pode ser ativado com menos de 50% do HP máximo</li>
        <li>• Não pode distribuir pontos de atributo com Selo ativo</li>
        <li>• Na Guerra de Clãs: disponível <strong>1× por batalha</strong></li>
      </ul>
    </InfoBox>
  </div>
);

const TabRanking = () => (
  <div className="space-y-6">
    <SectionTitle icon={Trophy}>Rankings</SectionTitle>

    <SubTitle>Ranking de Ninjas</SubTitle>
    <p className="text-sm text-muted-foreground">O ranking individual ordena todos os jogadores por <strong>nível</strong>. Em caso de empate, quem criou o personagem primeiro fica à frente.</p>
    <InfoBox title="Título de Kage" variant="info">
      O ninja de <strong>maior nível</strong> de cada aldeia recebe automaticamente o título de <strong>Kage</strong>. Este título é especial e aparece no perfil e no ranking, superando até o rank Sennin.
    </InfoBox>

    <SubTitle>Ranking de Clãs — Geral</SubTitle>
    <p className="text-sm text-muted-foreground">Clãs são ordenados por <strong>Pontos de Guerra</strong> acumulados ao longo do tempo. Este ranking <strong>nunca reseta</strong> e reflete o histórico completo do clã.</p>
    <InfoBox title="Bônus de Pontos de Guerra" variant="success">
      <p>Os Pontos de Guerra do clã dão bônus de atributos a <strong>todos os membros</strong> automaticamente:</p>
      <p className="font-bold mt-1">Bônus = √(pontos de guerra) × 2</p>
      <p className="text-xs mt-1">Exemplo: 100 pts → +20 em todos | 500 pts → +44 | 1000 pts → +63 (máximo)</p>
    </InfoBox>

    <SubTitle>Ranking de Clãs — Liga Semanal</SubTitle>
    <p className="text-sm text-muted-foreground">Ranking independente que reseta toda <strong>segunda-feira</strong>. Conta apenas guerras dessa semana. Top 3 ganham Ryo para o cofre do clã.</p>

    <SubTitle>Ranking de Clãs — Liga Mensal</SubTitle>
    <p className="text-sm text-muted-foreground">Ranking que reseta no <strong>início de cada mês</strong>. Prêmios maiores que o semanal para os Top 3.</p>

    <SubTitle>Vilas</SubTitle>
    <p className="text-sm text-muted-foreground">Ao criar seu personagem você escolhe uma vila. Você pode filtrar o ranking por vila para ver os melhores ninjas da sua aldeia.</p>
  </div>
);

const TabIchiraku = () => (
  <div className="space-y-6">
    <SectionTitle icon={Utensils}>Ichiraku Ramen</SectionTitle>
    <p className="text-sm text-muted-foreground">O Ichiraku é a loja de consumíveis do jogo. Compre itens para recuperar Vida e Chakra. Os itens ficam no seu inventário e você os usa na página de Status.</p>

    <SubTitle>Cardápio</SubTitle>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[
        { name: 'Onigiri Simples',           price: '150',   hp: '+100 HP' },
        { name: 'Chá Revigorante',           price: '220',   hp: '+150 HP' },
        { name: 'Dango Restaurador',         price: '350',   hp: '+250 HP' },
        { name: 'Miso Ramen',                price: '600',   hp: '+400 HP' },
        { name: 'Shio Ramen com Porco',      price: '850',   hp: '+600 HP' },
        { name: 'Tonkotsu Ramen Especial',   price: '1.100', hp: '+800 HP' },
        { name: 'Curry da Vida',             price: '1.500', hp: '+1.000 HP' },
      ].map(item => (
        <div key={item.name} className="rounded-lg border p-3 flex justify-between items-center">
          <div>
            <div className="font-medium text-sm">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.price} Ryo</div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{item.hp}</Badge>
        </div>
      ))}
    </div>

    <InfoBox title="💡 Dicas do Ichiraku" variant="success">
      <ul className="space-y-1">
        <li>• Selecione a <strong>quantidade</strong> antes de comprar para economizar tempo</li>
        <li>• Os itens <strong>não expiram</strong> — compre quando tiver Ryo sobrando</li>
        <li>• Use antes de batalhas PvP e Guerras de Clã para garantir HP máximo</li>
        <li>• Membros de clãs com Hospital de alto nível têm as poções mais eficientes</li>
      </ul>
    </InfoBox>
  </div>
);

const TabPremium = () => (
  <div className="space-y-6">
    <SectionTitle icon={Crown}>Sistema Premium</SectionTitle>

    <SubTitle>Clash Points (CP)</SubTitle>
    <p className="text-sm text-muted-foreground">CP é a moeda premium obtida com compras reais. Use no <strong>Mercado Premium</strong> para adquirir o Premium Pass e itens exclusivos.</p>

    <SubTitle>Premium Pass</SubTitle>
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-5 w-5 text-yellow-400" />
          Benefícios do Premium Pass
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2"><span className="text-yellow-400">✅</span> <span>5 jutsus por elemento (vs 3 free)</span></div>
          <div className="flex items-center gap-2"><span className="text-yellow-400">✅</span> <span>3 refreshes de missão por dia (vs 1)</span></div>
          <div className="flex items-center gap-2"><span className="text-yellow-400">✅</span> <span>2 horas de caçada por dia (vs 1h)</span></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><span className="text-yellow-400">✅</span> <span>Acesso a armas e invocações exclusivas</span></div>
          <div className="flex items-center gap-2"><span className="text-yellow-400">✅</span> <span>Itens premium no Mercado</span></div>
        </div>
      </CardContent>
    </Card>

    <InfoBox title="💎 Como obter CP" variant="info">
      <ul className="space-y-1">
        <li>• Acesse a aba <strong>"Comprar CP"</strong> no menu</li>
        <li>• Escolha o pacote desejado e finalize via MercadoPago</li>
        <li>• Os CP aparecem na sua conta após confirmação do pagamento</li>
        <li>• Use os CP no <strong>Mercado Premium</strong> para comprar o Pass ou itens exclusivos</li>
      </ul>
    </InfoBox>

    <InfoBox title="🆓 O jogo é jogável sem Premium?" variant="success">
      <p>Sim! Todo o conteúdo principal — missões, caçadas, batalhas, guerra de clã, invasão e ranking — é acessível gratuitamente. O Premium oferece conveniência e itens exclusivos, mas não é obrigatório para progredir.</p>
    </InfoBox>
  </div>
);

// ─── Mapa de conteúdo ────────────────────────────────────────────────

const TAB_CONTENT: Record<string, React.ReactNode> = {
  inicio:       <TabInicio />,
  status:       <TabStatus />,
  batalha:      <TabBatalha />,
  missoes:      <TabMissoes />,
  cacadas:      <TabCacadas />,
  elementos:    <TabElementos />,
  jutsus:       <TabJutsus />,
  equipamentos: <TabEquipamentos />,
  cla:          <TabCla />,
  guerra:       <TabGuerra />,
  invasao:      <TabInvasao />,
  poderes:      <TabPoderes />,
  ranking:      <TabRanking />,
  ichiraku:     <TabIchiraku />,
  premium:      <TabPremium />,
};

// ─── Página principal ────────────────────────────────────────────────

export default function ManualNinjaPage() {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div>
      <PageHeader
        title="Manual Ninja"
        description="Guia completo para novos e veteranos — aprenda tudo sobre os sistemas do jogo!"
      />

      <Card className="mt-8">
        {/* ── Barra de abas ────────────────────────────── */}
        <div className="border-b border-border">
          <div className="overflow-x-auto">
            <div className="flex min-w-max p-2 gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Conteúdo ──────────────────────────────────── */}
        <div className="p-6">
          {TAB_CONTENT[activeTab]}
        </div>
      </Card>
    </div>
  );
}