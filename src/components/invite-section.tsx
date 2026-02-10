'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InviteSection({ inviteCode, totalStudents }: { inviteCode: string; totalStudents: number }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "Link Copiado!",
      description: "Compartilhe com seus amigos para ganhar recompensas!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-indigo-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Sistema de Alunos
        </CardTitle>
        <CardDescription>
          Convide amigos e ganhe recompensas quando eles progredirem!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Seu Código de Convite</label>
          <div className="flex gap-2">
            <Input 
              value={inviteCode} 
              readOnly 
              className="font-mono text-lg font-bold text-center"
            />
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Link de Convite</label>
          <div className="flex gap-2">
            <Input 
              value={inviteLink} 
              readOnly 
              className="text-xs"
            />
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total de Alunos:</span>
            <span className="text-2xl font-bold text-purple-500">{totalStudents}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}