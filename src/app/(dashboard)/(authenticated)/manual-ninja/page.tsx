'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Activity, 
  Flame, 
  ScrollText, 
  Target, 
  Swords, 
  Users, 
  Utensils,
  Eye,
  ShieldQuestion,
  Footprints,
  Grip,
  Crown,
  Zap,
  Heart,
  Brain,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Coins,
  Clock,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ManualSection = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Icon className="h-6 w-6 text-primary" />
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    <Separator />
    <div className="space-y-4 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const InfoBox = ({ 
  title, 
  variant = "default", 
  children 
}: { 
  title: string; 
  variant?: "default" | "warning" | "success" | "info";
  children: React.ReactNode;
}) => {
  const colors = {
    default: "border-blue-500/20 bg-blue-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    success: "border-green-500/20 bg-green-500/5",
    info: "border-purple-500/20 bg-purple-500/5"
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[variant]}`}>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
};

const StatExplanation = ({ 
  name, 
  icon: Icon, 
  description, 
  effects 
}: { 
  name: string; 
  icon: React.ElementType; 
  description: string;
  effects: string[];
}) => (
  <Card className="bg-muted/30">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="h-5 w-5 text-primary" />
        {name}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-1">
        <p className="text-xs font-semibold">Efeitos:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          {effects.map((effect, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{effect}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default function ManualNinjaPage() {
  const [activeTab, setActiveTab] = useState("status");

  return (
    <div>
      <PageHeader
        title="Manual Ninja"
        description="Aprenda tudo sobre os sistemas do jogo e torne-se um ninja mais forte!"
      />

      <Card className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="elementos" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Elementos</span>
            </TabsTrigger>
            <TabsTrigger value="jutsus" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">Jutsus</span>
            </TabsTrigger>
            <TabsTrigger value="missoes" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Missões</span>
            </TabsTrigger>
            <TabsTrigger value="equipamentos" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Equipamentos</span>
            </TabsTrigger>
            <TabsTrigger value="outros" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Outros</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== ABA: STATUS ========== */}
          <TabsContent value="status" className="space-y-6 p-6">
            <ManualSection title="Sistema de Status" icon={Activity}>
              
              <div className="space-y-4">
                <p>
                  O sistema de status é a base do seu personagem. Cada atributo afeta diferentes aspectos do combate e da progressão.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-4">Atributos Primários</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatExplanation
                    name="Vitalidade"
                    icon={Heart}
                    description="Determina sua resistência e pontos de vida"
                    effects={[
                      "Aumenta sua vida máxima (HP)",
                      "Melhora sua resistência a dano",
                      "Essencial para sobreviver em batalhas longas"
                    ]}
                  />

                  <StatExplanation
                    name="Inteligência"
                    icon={Brain}
                    description="Governa seu chakra e habilidades estratégicas"
                    effects={[
                      "Aumenta seu chakra máximo",
                      "Melhora eficiência de jutsus",
                      "Afeta aprendizado de técnicas"
                    ]}
                  />

                  <StatExplanation
                    name="Taijutsu"
                    icon={Swords}
                    description="Poder de combate corpo-a-corpo"
                    effects={[
                      "Aumenta dano de ataques físicos",
                      "Melhora precisão em combate",
                      "Fortalecido pelo elemento Futon (Vento)"
                    ]}
                  />

                  <StatExplanation
                    name="Ninjutsu"
                    icon={Flame}
                    description="Habilidade com técnicas ninja"
                    effects={[
                      "Aumenta dano de jutsus",
                      "Melhora controle de chakra",
                      "Fortalecido pelo elemento Katon (Fogo)"
                    ]}
                  />

                  <StatExplanation
                    name="Genjutsu"
                    icon={Eye}
                    description="Maestria em ilusões"
                    effects={[
                      "Aumenta efetividade de ilusões",
                      "Melhora resistência mental",
                      "Fortalecido pelo elemento Doton (Terra)"
                    ]}
                  />

                  <StatExplanation
                    name="Selo"
                    icon={Shield}
                    description="Conhecimento em técnicas de selamento"
                    effects={[
                      "Aumenta poder de técnicas de selo",
                      "Melhora defesa contra jutsus",
                      "Fortalecido pelo elemento Raiton (Raio)"
                    ]}
                  />
                </div>

                <InfoBox title="💡 Dica Importante" variant="info">
                  Cada 10 níveis de um elemento concedem <strong>+20</strong> ao atributo correspondente:
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Katon (Fogo) → Ninjutsu</li>
                    <li>• Futon (Vento) → Taijutsu</li>
                    <li>• Raiton (Raio) → Selo</li>
                    <li>• Doton (Terra) → Genjutsu</li>
                    <li>• Suiton (Água) → Inteligência</li>
                  </ul>
                </InfoBox>

                <h3 className="text-xl font-semibold mt-6 mb-4">Distribuição de Pontos</h3>
                
                <InfoBox title="Como Funciona" variant="default">
                  <ul className="space-y-2">
                    <li>• Você ganha <strong>5 pontos de atributo</strong> a cada nível</li>
                    <li>• Distribua livremente entre os 6 atributos</li>
                    <li>• Escolha seu estilo: especialista ou balanceado</li>
                    <li>• Não é possível remover pontos após distribuir</li>
                  </ul>
                </InfoBox>

                <InfoBox title="⚠️ Atenção" variant="warning">
                  Você <strong>não pode distribuir pontos</strong> enquanto estiver com Dōjutsu ou Selo Amaldiçoado ativos! 
                  Desative-os primeiro na página de Status.
                </InfoBox>

                <h3 className="text-xl font-semibold mt-6 mb-4">Recursos Vitais</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-red-500/10 to-red-900/10 border-red-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-400">
                        <Heart className="h-5 w-5" />
                        Vida (HP)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>Sua saúde atual. Ao chegar a 0, você é derrotado.</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Use itens do Ichiraku para recuperar</li>
                        <li>• Vida máxima aumenta com Vitalidade</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-400">
                        <Sparkles className="h-5 w-5" />
                        Chakra
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>Energia necessária para missões, caçadas.</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Regenera <strong>1 por minuto</strong> automaticamente</li>
                        <li>• Necessário para missões e batalhas</li>
                        <li>• Chakra máximo aumenta com Inteligência</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </ManualSection>
          </TabsContent>

          {/* ========== ABA: ELEMENTOS ========== */}
          <TabsContent value="elementos" className="space-y-6 p-6">
            <ManualSection title="Sistema de Elementos" icon={Flame}>
              
              <p>
                Elementos são a base do poder ninja. Domine-os para desbloquear jutsus poderosos e fortalecer seus atributos!
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-4">Os 5 Elementos Básicos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-900/10 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-400">
                      <Flame className="h-5 w-5" />
                      Katon (Fogo)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Elemento do poder destrutivo</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Bônus:</p>
                      <p className="text-xs">+2 Ninjutsu por nível</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-900/10 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <Zap className="h-5 w-5" />
                      Futon (Vento)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Elemento da velocidade e corte</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Bônus:</p>
                      <p className="text-xs">+2 Taijutsu por nível</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-900/10 border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-400">
                      <Zap className="h-5 w-5" />
                      Raiton (Raio)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Elemento da precisão letal</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Bônus:</p>
                      <p className="text-xs">+2 Selo por nível</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-700/10 to-yellow-900/10 border-amber-700/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <Shield className="h-5 w-5" />
                      Doton (Terra)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Elemento da defesa sólida</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Bônus:</p>
                      <p className="text-xs">+2 Genjutsu por nível</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-900/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-400">
                      <Sparkles className="h-5 w-5" />
                      Suiton (Água)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Elemento da adaptação</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Bônus:</p>
                      <p className="text-xs">+2 Inteligência por nível</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-4">Como Evoluir Elementos</h3>

              <InfoBox title="Progressão" variant="info">
                <ul className="space-y-2">
                  <li>• Elementos sobem de nível através de <strong>Missões</strong></li>
                  <li>• Cada missão concede XP elemental específico</li>
                  <li>• Nível máximo de elemento: <strong>10</strong></li>
                  <li>• Quanto mais alto o nível, mais jutsus você desbloqueia</li>
                </ul>
              </InfoBox>

              <InfoBox title="💡 Estratégia" variant="success">
                <p className="mb-2">Foque nos elementos que complementam seu estilo de jogo:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Lutador corpo-a-corpo?</strong> Priorize Futon</li>
                  <li>• <strong>Mago de jutsus?</strong> Invista em Katon</li>
                  <li>• <strong>Estrategista?</strong> Desenvolva Suiton e Raiton</li>
                  <li>• <strong>Tanque?</strong> Doton te dará resistência</li>
                </ul>
              </InfoBox>

            </ManualSection>
          </TabsContent>

          {/* ========== ABA: JUTSUS ========== */}
          <TabsContent value="jutsus" className="space-y-6 p-6">
            <ManualSection title="Sistema de Jutsus" icon={ScrollText}>
              
              <p>
                Jutsus são as técnicas ninjas que você pode aprender e dominar. Cada jutsu está vinculado a um elemento específico.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-4">Como Aprender Jutsus</h3>

              <InfoBox title="Requisitos" variant="default">
                <ul className="space-y-2">
                  <li>• Alcance o <strong>nível de elemento necessário</strong> para desbloquear</li>
                  <li>• Exemplo: Jutsu requer Katon nível 3 → você precisa ter Katon nv. 3</li>
                  <li>• Clique em "Aprender" na página de Elementos</li>
                  <li>• O jutsu começa no nível 1</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Evoluindo Jutsus</h3>

              <InfoBox title="Sistema de XP" variant="info">
                <ul className="space-y-2">
                  <li>• Jutsus ganham XP ao completar <strong>Missões</strong></li>
                  <li>• Cada missão concede XP para um jutsu específico</li>
                  <li>• Nível máximo de jutsu: <strong>25</strong></li>
                  <li>• Quanto maior o nível, mais poderoso o jutsu em batalha</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Limites de Jutsus</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-gray-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Jogador Free</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Até <strong>3 jutsus por elemento</strong>
                    </p>
                    <p className="text-xs text-yellow-500">
                      Total: 15 jutsus (5 elementos × 3)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Jogador Premium
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Até <strong>5 jutsus por elemento</strong>
                    </p>
                    <p className="text-xs text-yellow-500">
                      Total: 25 jutsus (5 elementos × 5)
                    </p>
                  </CardContent>
                </Card>
              </div>

              <InfoBox title="⚠️ Importante" variant="warning">
                Se você atingir o limite e não for Premium, jutsus adicionais ficarão <strong>bloqueados</strong> até você:
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Adquirir Premium.</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Uso em Batalha</h3>

              <InfoBox title="Como Funcionam" variant="success">
                <ul className="space-y-2">
                  <li>• Durante batalhas (Caçadas/Invasão), jutsus são usados <strong>automaticamente</strong></li>
                  <li>• O sistema escolhe o melhor jutsu aleatoriamente.</li>
                  <li>• Jutsus de nível alto causam mais dano</li>
                  <li>• Combine com equipamentos para máximo poder!</li>
                </ul>
              </InfoBox>

            </ManualSection>
          </TabsContent>

          {/* ========== ABA: MISSÕES ========== */}
          <TabsContent value="missoes" className="space-y-6 p-6">
            <ManualSection title="Sistema de Missões e Caçadas" icon={Target}>
              
              <h3 className="text-xl font-semibold mb-4">Missões Diárias</h3>

              <p>
                O sistema principal de progressão. Complete missões para ganhar XP, Ryo e evoluir seus elementos e jutsus!
              </p>

              <InfoBox title="Como Funcionam" variant="default">
                <ul className="space-y-2">
                  <li>• <strong>15 missões novas</strong> a cada 12 horas (00:00 e 12:00 BRT)</li>
                  <li>• Missões de diferentes dificuldades: Fácil, Média, Difícil, Heróica</li>
                  <li>• Cada missão tem duração e recompensas específicas</li>
                  <li>• Só pode fazer <strong>1 missão por vez</strong></li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Dificuldades</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-400">Fácil</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>• Curta duração</p>
                    <p>• Baixas recompensas</p>
                    <p>• Ideal para iniciantes</p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-400">Média</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>• Duração moderada</p>
                    <p>• Recompensas balanceadas</p>
                    <p>• Boa para progressão</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-400">Difícil</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>• Longa duração</p>
                    <p>• Altas recompensas</p>
                    <p>• Para ninjas experientes</p>
                  </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-400">Heróica</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>• Muito longa</p>
                    <p>• Recompensas máximas</p>
                    <p>• Apenas para os melhores</p>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-4">Atualização de Missões</h3>

              <InfoBox title="Sistema de Refresh" variant="info">
                <ul className="space-y-2">
                  <li>• <strong>Jogadores Free:</strong> 1 atualização por dia</li>
                  <li>• <strong>Jogadores Premium:</strong> 3 atualizações por dia</li>
                  <li>• Use para trocar missões que não quer fazer</li>
                  <li>• Resets não acumulam (use ou perca!)</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Caçadas</h3>

              <p>Alternativa às missões para ganhar recursos rapidamente.</p>

              <InfoBox title="Como Funcionam" variant="default">
                <ul className="space-y-2">
                  <li>• Escolha a duração (5 a 60 minutos)</li>
                  <li>• Limite: <strong>1 hora total por dia</strong></li>
                  <li>• Recompensas: 20 Ryo/min + 30 XP/min</li>
                  <li>• Não pode fazer outras atividades durante caçada</li>
                  <li>• Resets automáticos às 00:00 BRT</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Buscar Oponente</h3>

              <InfoBox title="Sistema de Batalha PvP" variant="warning">
                <ul className="space-y-2">
                  <li>• Custo: <strong>50 Chakra</strong> por busca</li>
                  <li>• Vida mínima: <strong>100 HP</strong></li>
                  <li>• Sistema encontra oponentes de nível similar (±2)</li>
                  <li>• Batalhas são automáticas e turno-a-turno</li>
                  <li>• <strong>Vitória:</strong> Ganha 5% do Ryo do oponente + 20 XP</li>
                  <li>• <strong>Derrota:</strong> Perde 5% do seu Ryo</li>
                </ul>
              </InfoBox>

            </ManualSection>
          </TabsContent>

          {/* ========== ABA: EQUIPAMENTOS ========== */}
          <TabsContent value="equipamentos" className="space-y-6 p-6">
            <ManualSection title="Sistema de Equipamentos" icon={Swords}>
              
              <h3 className="text-xl font-semibold mb-4">Tipos de Equipamento</h3>

              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-900/10 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Swords className="h-5 w-5 text-orange-400" />
                      Armas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Equipamentos ofensivos que aumentam seus atributos de combate.</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Apenas <strong>1 arma equipada</strong> por vez</li>
                      <li>• Compre na página "Armas"</li>
                      <li>• Venda por 50% do valor original</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Footprints className="h-5 w-5 text-purple-400" />
                      Invocações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Criaturas lendárias que concedem bônus permanentes.</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Apenas <strong>1 contrato ativo</strong> por vez</li>
                      <li>• Sistema de <strong>treinamento</strong> (até nível 10)</li>
                      <li>• Escolha 1 atributo para treinar (+2 por nível)</li>
                      <li>• Custo de treinamento aumenta com o nível</li>
                      <li>• Você so pode treinar 1 atributo por vez</li>
                      <li>• Exemplo - se você fizer upgrade no selo e depois mudar para vitalidade, o upgrade saira do selo e ira para a vitalidade +4 (2 do selo e 2 da vitalidade).</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-900/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grip className="h-5 w-5 text-blue-400" />
                      Armaduras (Arsenal)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Equipamentos defensivos em 4 slots:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• <strong>Peito:</strong> Proteção do tronco</li>
                      <li>• <strong>Pernas:</strong> Mobilidade e resistência</li>
                      <li>• <strong>Pés:</strong> Velocidade</li>
                      <li>• <strong>Mãos:</strong> Destreza</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-4">Itens Premium</h3>

              <InfoBox title="Armas e Invocações Exclusivas" variant="info">
                <p className="mb-2">Alguns itens são exclusivos para jogadores Premium:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Marcados com ícone <Crown className="h-3 w-3 inline text-yellow-500" /></li>
                  <li>• Geralmente mais poderosos que itens normais</li>
                  <li>• Requerem Premium Pass ativo para comprar/usar</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Estratégias de Equipamento</h3>

              <InfoBox title="💡 Dicas" variant="success">
                <ul className="space-y-2">
                  <li>• <strong>Combine com seus atributos:</strong> Foco em Ninjutsu? Procure armas que aumentem Ninjutsu</li>
                  <li>• <strong>Treine invocações estrategicamente:</strong> Escolha o atributo mais importante pro seu estilo</li>
                  <li>• <strong>Venda itens antigos:</strong> Recupere 50% do investimento para comprar melhores</li>
                  <li>• <strong>Complete o arsenal:</strong> Equipe todas as 4 peças de armadura para máximo poder</li>
                </ul>
              </InfoBox>

            </ManualSection>
          </TabsContent>

          {/* ========== ABA: OUTROS ========== */}
          <TabsContent value="outros" className="space-y-6 p-6">
            <ManualSection title="Outros Sistemas" icon={BookOpen}>
              
              <h3 className="text-xl font-semibold mb-4">Dōjutsu (Poder Ocular)</h3>

              <p>Poderes oculares lendários que transformam seu personagem.</p>

              <InfoBox title="Como Despertar" variant="default">
                <ul className="space-y-2">
                  <li>• Alcance os requisitos de nível e elemento</li>
                  <li>• Escolha seu caminho: Sharingan, Byakugan</li>
                  <li>• Escolha é <strong>permanente</strong> - pense bem!</li>
                  <li>• Cada caminho tem 2 evoluções</li>
                </ul>
              </InfoBox>

              <InfoBox title="Como Usar" variant="warning">
                <ul className="space-y-2">
                  <li>• Ative/Desative na página de Status</li>
                  <li>• Consome <strong>1 chakra por segundo</strong> quando ativo</li>
                  <li>• Cooldown de <strong>1 hora</strong> após desativar</li>
                  <li>• Concede bônus poderosos a atributos</li>
                  <li>• Você <strong>não pode distribuir pontos</strong> com Dōjutsu ativo</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Selo Amaldiçoado</h3>

              <InfoBox title="Sistema de Risco/Recompensa" variant="warning">
                <ul className="space-y-2">
                  <li>• <strong>Nível 1:</strong> 25% chance de obter (Req: Nv. 30 + 15 Elem.)</li>
                  <li>• <strong>Nível 2:</strong> 50% chance de evoluir (Req: 30 Elem.)</li>
                  <li>• <strong>Falha:</strong> Deixa você com 1 HP</li>
                  <li>• Duração: 30 minutos ativos</li>
                  <li>• Cooldown: 24 horas após uso</li>
                </ul>
              </InfoBox>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Nível 1</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p className="text-green-400">+20% Ninjutsu, +20% Taijutsu, +15% Selo</p>
                    <p className="text-red-400">-15% Vida Máxima</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Nível 2</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p className="text-green-400">+40% Ninjutsu, +40% Taijutsu, +30% Selo</p>
                    <p className="text-red-400">-30% Vida Máxima</p>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-4">Ichiraku Ramen</h3>

              <InfoBox title="Loja de Consumíveis" variant="success">
                <ul className="space-y-2">
                  <li>• Compre itens para recuperar Vida.</li>
                  <li>• Itens ficam no seu <strong>Inventário</strong> (página Status)</li>
                  <li>• Use quando precisar - não expiram</li>
                  <li>• Selecione quantidade antes de comprar</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Clãs</h3>

              <InfoBox title="Sistema Social" variant="info">
                <ul className="space-y-2">
                  <li>• <strong>Crie</strong> um clã por 10.000 Ryo ou <strong>junte-se</strong> a um existente</li>
                  <li>• Clãs têm nível e XP próprios</li>
                  <li>• <strong>Missões de Clã:</strong> 10 missões compartilhadas, resetam às 12h</li>
                  <li>• Complete missões para evoluir o clã</li>
                  <li>• Membros máximos aumentam com nível do clã (5 + nível, máx 30)</li>
                  <li>• Chat privado do clã</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Invasão Global</h3>

              <InfoBox title="Evento de Boss Mundial" variant="warning">
                <ul className="space-y-2">
                  <li>• Boss aparece <strong>semanalmente</strong></li>
                  <li>• Todos os jogadores atacam o mesmo boss</li>
                  <li>• Cooldown: <strong>10 minutos</strong> entre ataques</li>
                  <li>• Recompensas ao derrotar + drops raros</li>
                  <li>• Itens de boss ficam no inventário especial</li>
                </ul>
              </InfoBox>

              <h3 className="text-xl font-semibold mt-6 mb-4">Sistema Premium</h3>

              <div className="grid grid-cols-1 gap-4">
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Benefícios Premium
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1 text-xs">
                      <li>✅ Até 5 jutsus por elemento (vs 3 free)</li>
                      <li>✅ 3 atualizações de missões/dia (vs 1 free)</li>
                      <li>✅ Acesso a armas exclusivas</li>
                      <li>✅ Acesso a invocações exclusivas</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

            </ManualSection>
          </TabsContent>

        </Tabs>
      </Card>
    </div>
  );
}
