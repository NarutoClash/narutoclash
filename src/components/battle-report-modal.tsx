'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Swords, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type BattleLogEntry = string | {
  turn: number;
  attacker: 'player' | 'boss';
  attackType?: string;
  jutsuName: string;
  jutsuGif: string | null;
  damageLog: string;
  damage: number;
  playerHealth?: string;
};

interface BattleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  battleLog: BattleLogEntry[];
  totalDamage: number;
  bossDefeated: boolean;
}

export function BattleReportModal({ 
  isOpen, 
  onClose, 
  battleLog, 
  totalDamage,
  bossDefeated 
}: BattleReportModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Swords className="h-6 w-6" />
            {bossDefeated ? '🎉 VITÓRIA! Boss Derrotado!' : 'Relatório de Batalha'}
          </DialogTitle>
          <DialogDescription>
            Dano total causado: <span className="text-amber-400 font-bold text-lg">{totalDamage.toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] w-full pr-4">
          <div className="space-y-3">
            {battleLog.map((log, index) => {
              // Se for string (logs antigos ou mensagens gerais)
              if (typeof log === 'string') {
                return (
                  <p key={index} className="font-mono text-xs p-2 bg-muted rounded">
                    {log}
                  </p>
                );
              }
              
              // Se for objeto (novo formato com jutsu e gif)
              return (
                <div 
                  key={index} 
                  className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm font-semibold">
                      <span className={log.attacker === 'player' ? 'text-green-500' : 'text-red-500'}>
                        Turno {log.turn}
                      </span>
                      {' '}
                      ({log.attacker === 'player' ? '🥷 Você' : '👹 Chefe'})
                    </p>
                    <span className="text-primary font-semibold text-sm">
                      {log.jutsuName}
                    </span>
                  </div>
                  
                  {log.jutsuGif && (
                    <div className="flex justify-center my-3">
                      <img 
                        src={log.jutsuGif} 
                        alt={log.jutsuName}
                        className="w-full max-w-[300px] rounded-lg border-2 border-primary shadow-lg"
                      />
                    </div>
                  )}
                  
                  <p className="font-mono text-xs text-muted-foreground mb-2">
                    {log.damageLog}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-amber-400 font-bold">
                      💥 {log.damage.toLocaleString()} de dano
                    </p>
                    
                    {log.playerHealth && (
                      <p className="font-mono text-sm text-red-400">
                        ❤️ Sua vida: {log.playerHealth} HP
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-primary"
          >
            Continuar Lutando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}