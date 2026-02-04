'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Swords, 
  Target,
  Sparkles,
  ArrowRight,
  Eye,
  Users,
  Scroll,
  Ghost,
  Crown
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Target,
      title: 'Missões Épicas',
      description: 'Complete missões diárias e ganhe recompensas. Escolha entre Rank D até S!',
      color: 'text-orange-500'
    },
    {
      icon: Flame,
      title: 'Domínio Elemental',
      description: 'Domine os 5 elementos e aprenda jutsus poderosos de cada natureza!',
      color: 'text-red-500'
    },
    {
      icon: Swords,
      title: 'Arsenal Ninja',
      description: 'Adquira armas lendárias e equipamentos exclusivos para aumentar seu poder!',
      color: 'text-blue-500'
    },
    {
      icon: Eye,
      title: 'Dōjutsu',
      description: 'Desperte poderes oculares como Sharingan, Byakugan e Rinnegan!',
      color: 'text-purple-500'
    },
    {
      icon: Trophy,
      title: 'Ranking Ninja',
      description: 'Suba de Genin até Kage! Compete e prove que é o shinobi mais forte!',
      color: 'text-amber-500'
    },
    {
      icon: Sparkles,
      title: 'Itens Premium',
      description: 'Adquira CP e desbloqueie conteúdos exclusivos no Mercado Premium!',
      color: 'text-yellow-500'
    }
  ];

  const gameStats = [
    { icon: Scroll, label: 'Missões Normais', value: '100+', color: 'text-orange-500' },
    { icon: Target, label: 'Missões de Clã', value: '50+', color: 'text-blue-500' },
    { icon: Flame, label: 'Jutsus', value: '25+', color: 'text-red-500' },
    { icon: Swords, label: 'Armas', value: '30+', color: 'text-cyan-500' },
    { icon: Ghost, label: 'Invocações', value: '20+', color: 'text-purple-500' },
    { icon: Crown, label: 'Bosses', value: '25+', color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 flex">
      
      {/* Sidebar Esquerda Fixa */}
      <aside className="hidden lg:block w-64 xl:w-80 fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-black border-r border-orange-500/20 p-6 overflow-y-auto">
        <div className="space-y-4 mt-6">
          <h3 className="text-orange-400 font-bold text-lg mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Sobre o Jogo
          </h3>
          
          {gameStats.map((stat, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition-all"
            >
              <stat.icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <span className="text-2xl font-bold text-orange-400">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Conteúdo Central */}
      <div className="flex-1 lg:ml-64 xl:ml-80 lg:mr-64 xl:mr-80">
        
        {/* Header Fixo */}
        <header className="border-b border-orange-500/20 backdrop-blur-sm bg-black/50 fixed top-0 left-0 lg:left-64 xl:left-80 right-0 lg:right-64 xl:right-80 z-50">
          <div className="px-2 py-4 flex justify-center">
            <img 
              src="https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Telas/nome%20site.png"
              alt="Naruto Clash"
              className="h-32 md:h-40 lg:h-48 w-auto object-contain"
            />
          </div>
        </header>

        {/* Conteúdo com padding-top para compensar o header fixo */}
        <div className="pt-32 md:pt-40 lg:pt-48">
          {/* Hero Section */}
          <section className="px-4 py-20 text-center relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-20 w-1 h-1 bg-red-500 rounded-full animate-pulse delay-100"></div>
              <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse delay-200"></div>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent leading-tight animate-fade-in">
              Torne-se um<br />Shinobi Lendário
            </h2>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Domine os elementos, complete missões épicas, adquira armas lendárias 
              e alcance o topo do ranking ninja em Naruto Clash!
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg px-8 py-6 shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 transition-all"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Começar Jornada
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-orange-500/50 hover:bg-orange-500/10 text-lg px-8 py-6"
              >
                Saber Mais
              </Button>
            </div>
          </section>

          {/* Stats Section */}
          <section className="px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-105">
                <Flame className="h-12 w-12 text-orange-500 mx-auto mb-3 animate-pulse" />
                <div className="text-4xl font-bold text-orange-400 mb-2">5</div>
                <div className="text-gray-400">Elementos Ninjas</div>
              </div>
              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-105">
                <Swords className="h-12 w-12 text-blue-500 mx-auto mb-3 animate-pulse" />
                <div className="text-4xl font-bold text-orange-400 mb-2">50+</div>
                <div className="text-gray-400">Armas & Jutsus</div>
              </div>
              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-105">
                <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-3 animate-pulse" />
                <div className="text-4xl font-bold text-orange-400 mb-2">∞</div>
                <div className="text-gray-400">Possibilidades</div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="px-4 py-20">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                Recursos do Jogo
              </h3>
              <p className="text-gray-400 text-lg">Descubra tudo que Naruto Clash tem para oferecer</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <CardHeader>
                    <feature.icon className={`h-12 w-12 mb-3 ${feature.color}`} />
                    <CardTitle className="text-orange-400 text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 py-20">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-12 text-center">
              <h3 className="text-4xl font-bold mb-4 text-white">
                Pronto para Começar?
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de ninjas e comece sua jornada épica agora mesmo!
              </p>
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg px-12 py-6 shadow-xl shadow-orange-500/50"
                >
                  <Flame className="mr-2 h-5 w-5" />
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-orange-500/20 bg-black/50 py-8">
            <div className="px-4 text-center text-gray-400">
              <p className="mb-2">© 2026 Naruto Clash. Todos os direitos reservados.</p>
              <p className="text-sm">
                Este é um jogo de fãs não oficial baseado no universo de Naruto.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Sidebar Direita Fixa */}
      <aside className="hidden lg:block w-64 xl:w-80 fixed right-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-black border-l border-orange-500/20 p-6 overflow-y-auto">
        <div className="space-y-4 mt-6">
          <h3 className="text-orange-400 font-bold text-lg mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Comece Agora
          </h3>
          
          <Link href="/login" className="w-full block">
            <Button 
              variant="ghost" 
              className="w-full hover:bg-orange-500/10 text-gray-300 hover:text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all h-12"
            >
              <Users className="mr-2 h-5 w-5" />
              Entrar
            </Button>
          </Link>
          
          <Link href="/register" className="w-full block">
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all h-12"
            >
              <Zap className="mr-2 h-5 w-5" />
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Badge className="w-full bg-orange-500/20 text-orange-400 border-orange-500/50 text-sm px-4 py-2 justify-center">
            <Flame className="h-4 w-4 mr-2 animate-pulse" />
            Em Desenvolvimento Ativo
          </Badge>
        </div>
      </aside>
      
    </div>
  );
}
