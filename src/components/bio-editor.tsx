'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit, Save, X, Eye, Image as ImageIcon,
  Bold, Italic, Underline, Palette,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/supabase';

interface BioEditorProps {
  profileId: string;
  initialContent?: string;
  isOwner: boolean;
}

// ─── BBCode helpers ────────────────────────────────────────────────────────────

const processTextFormatting = (text: string) => {
  let p = text.replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>');
  p = p.replace(/\[i\]([\s\S]*?)\[\/i\]/g, '<em>$1</em>');
  p = p.replace(/\[u\]([\s\S]*?)\[\/u\]/g, '<u>$1</u>');
  p = p.replace(/\[s\]([\s\S]*?)\[\/s\]/g, '<s>$1</s>');

  const colorMap: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    purple: '#a855f7', pink: '#ec4899', orange: '#f97316', cyan: '#06b6d4',
    white: '#ffffff', black: '#000000', gray: '#6b7280', gold: '#fbbf24',
  };
  Object.entries(colorMap).forEach(([name, hex]) => {
    p = p.replace(
      new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`, 'g'),
      `<span style="color:${hex}">$1</span>`
    );
  });
  p = p.replace(/\[size=([\s\S]*?)\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:$1">$2</span>');
  return p;
};

// ─── Parse BBCode into parts ───────────────────────────────────────────────────

type Part =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string };

const parseContent = (content: string): Part[] => {
  const parts: Part[] = [];
  let lastIndex = 0;
  const re = /\[img(?:=[^\]]*)?\]([\s\S]*?)\[\/img\]/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    parts.push({ type: 'image', url: match[1].trim() });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < content.length)
    parts.push({ type: 'text', content: content.substring(lastIndex) });

  return parts;
};

// ─── Render parts — images flush with zero gap ────────────────────────────────

const renderContent = (parts: Part[]) => {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    if (part.type === 'image') {
      // Collect all consecutive images into one zero-gap block
      const images: string[] = [];
      while (i < parts.length && parts[i].type === 'image') {
        images.push((parts[i] as { type: 'image'; url: string }).url);
        i++;
      }
      elements.push(
        <div key={`imgs-${i}`} style={{ fontSize: 0, lineHeight: 0, display: 'block' }}>
          {images.map((url, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={url}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                margin: 0,
                padding: 0,
                border: 0,
                lineHeight: 0,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
      );
    } else {
      elements.push(
        <p
          key={`text-${i}`}
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processTextFormatting(part.content) }}
        />
      );
      i++;
    }
  }

  return elements;
};

// ─── Main component ────────────────────────────────────────────────────────────

export function BioEditor({ profileId, initialContent = '', isOwner }: BioEditorProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [isEditing, setIsEditing]         = useState(false);
  const [bioContent, setBioContent]       = useState(initialContent);
  const [isSaving, setIsSaving]           = useState(false);
  const [showPreview, setShowPreview]     = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioContent.trim() || null })
        .eq('id', profileId);
      if (error) throw error;
      toast({ title: 'Bio atualizada!' });
      setIsEditing(false);
      setShowPreview(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBioContent(initialContent);
    setIsEditing(false);
    setShowPreview(false);
  };

  const insert = (snippet: string) => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const pos = textarea?.selectionStart ?? bioContent.length;
    setBioContent(bioContent.slice(0, pos) + snippet + bioContent.slice(pos));
  };

  const colors = [
    { name: 'red',    label: 'Vermelho', color: '#ef4444' },
    { name: 'blue',   label: 'Azul',     color: '#3b82f6' },
    { name: 'green',  label: 'Verde',    color: '#22c55e' },
    { name: 'yellow', label: 'Amarelo',  color: '#eab308' },
    { name: 'purple', label: 'Roxo',     color: '#a855f7' },
    { name: 'pink',   label: 'Rosa',     color: '#ec4899' },
    { name: 'orange', label: 'Laranja',  color: '#f97316' },
    { name: 'cyan',   label: 'Ciano',    color: '#06b6d4' },
    { name: 'gold',   label: 'Dourado',  color: '#fbbf24' },
    { name: 'white',  label: 'Branco',   color: '#ffffff' },
    { name: 'gray',   label: 'Cinza',    color: '#6b7280' },
  ];

  if (!bioContent && !isOwner) return null;

  const parsedContent = parseContent(bioContent);

  return (
    <Card>
      {isOwner && !isEditing && (
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
          <div className="text-sm text-muted-foreground">
            {bioContent ? 'Descrição do perfil' : 'Nenhuma descrição ainda'}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </CardHeader>
      )}

      <CardContent className={isOwner && !isEditing ? 'pt-2 px-0 pb-0' : 'pt-6'}>
        {isEditing ? (
          <div className="space-y-4 px-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="bio-content" className="text-sm font-medium">Descrição</label>
                <Button type="button" variant="outline"
                  onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar' : 'Preview'}
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md border">
                <Button type="button" variant="ghost"
                  onClick={() => insert('[b]texto em negrito[/b]')} title="Negrito">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost"
                  onClick={() => insert('[i]texto em itálico[/i]')} title="Itálico">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost"
                  onClick={() => insert('[u]texto sublinhado[/u]')} title="Sublinhado">
                  <Underline className="h-4 w-4" />
                </Button>

                <div className="relative">
                  <Button type="button" variant="ghost"
                    onClick={() => setShowColorMenu(!showColorMenu)} title="Cor">
                    <Palette className="h-4 w-4" />
                  </Button>
                  {showColorMenu && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-10 grid grid-cols-4 gap-1 min-w-[200px]">
                      {colors.map(c => (
                        <button key={c.name} type="button"
                          onClick={() => { insert(`[${c.name}]texto colorido[/${c.name}]`); setShowColorMenu(false); }}
                          className="p-2 rounded hover:bg-muted transition-colors flex flex-col items-center gap-1"
                          title={c.label}>
                          <div className="w-6 h-6 rounded border-2 border-border" style={{ backgroundColor: c.color }} />
                          <span className="text-xs">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-l mx-1" />

                <Button type="button" variant="ghost"
                  onClick={() => insert('[img]URL_DA_IMAGEM[/img]')}
                  title="Inserir Imagem">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                id="bio-content"
                placeholder="Escreva sobre você... Use as ferramentas acima para formatar. Você pode inserir imagens com [img]URL[/img]"
                value={bioContent}
                onChange={(e) => setBioContent(e.target.value.slice(0, 1000))}
                rows={10}
                className="resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>BBCode: [b]negrito[/b] [i]itálico[/i] [img]url[/img]</span>
                <span className={bioContent.length >= 950 ? 'text-orange-400 font-bold' : ''}>{bioContent.length}/1000</span>
              </div>
            </div>

            {showPreview && bioContent && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview:</h4>
                <div className="rounded-lg border overflow-hidden bg-muted/20 min-h-[100px]">
                  {renderContent(parsedContent)}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            {bioContent ? (
              renderContent(parsedContent)
            ) : (
              isOwner && (
                <div className="text-center py-8 text-muted-foreground px-6">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clique em "Editar" para adicionar informações sobre você</p>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
