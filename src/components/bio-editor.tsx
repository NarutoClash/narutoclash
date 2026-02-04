'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, Eye, Image as ImageIcon, Bold, Italic, Underline, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/supabase';
import Image from 'next/image';

interface BioEditorProps {
  profileId: string;
  initialContent?: string;
  isOwner: boolean;
}

// Função para processar BBCode em HTML
const processTextFormatting = (text: string) => {
  // Processa [b]texto[/b] para negrito
  let processed = text.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
  
  // Processa [i]texto[/i] para itálico
  processed = processed.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
  
  // Processa [u]texto[/u] para sublinhado
  processed = processed.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
  
  // Processa [s]texto[/s] para tachado
  processed = processed.replace(/\[s\](.*?)\[\/s\]/g, '<s>$1</s>');
  
  // Processa cores nomeadas: [red], [blue], [green], etc
  const colorMap: { [key: string]: string } = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    purple: '#a855f7',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
    white: '#ffffff',
    black: '#000000',
    gray: '#6b7280',
    gold: '#fbbf24',
  };
  
  Object.keys(colorMap).forEach(colorName => {
    const regex = new RegExp(`\\[${colorName}\\](.*?)\\[\\/${colorName}\\]`, 'g');
    processed = processed.replace(regex, `<span style="color: ${colorMap[colorName]}">$1</span>`);
  });
  
  // Processa [size=tamanho]texto[/size] para tamanho
  processed = processed.replace(/\[size=(.*?)\](.*?)\[\/size\]/g, '<span style="font-size: $1">$2</span>');
  
  return processed;
};

// Função para processar o texto e converter [img]url[/img] em imagens
const parseContent = (content: string) => {
  const parts: Array<{ type: 'text' | 'image'; content: string }> = [];
  const regex = /\[img\](.*?)\[\/img\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Adiciona texto antes da imagem
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Adiciona a imagem
    parts.push({
      type: 'image',
      content: match[1]
    });
    
    lastIndex = regex.lastIndex;
  }
  
  // Adiciona texto restante
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  return parts;
};

export function BioEditor({ profileId, initialContent, isOwner }: BioEditorProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [bioContent, setBioContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    if (!supabase) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio_content: bioContent.trim() || null,
          bio_image_url: null, // Não usa mais este campo
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Bio atualizada!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      setIsEditing(false);
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Erro ao salvar bio:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error?.message || 'Não foi possível salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBioContent(initialContent || '');
    setIsEditing(false);
    setShowPreview(false);
  };

  const insertImageTag = () => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || bioContent.length;
    const before = bioContent.substring(0, cursorPos);
    const after = bioContent.substring(cursorPos);
    setBioContent(before + '[img]URL_DA_IMAGEM[/img]' + after);
  };

  const insertBoldTag = () => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || bioContent.length;
    const before = bioContent.substring(0, cursorPos);
    const after = bioContent.substring(cursorPos);
    setBioContent(before + '[b]texto em negrito[/b]' + after);
  };

  const insertItalicTag = () => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || bioContent.length;
    const before = bioContent.substring(0, cursorPos);
    const after = bioContent.substring(cursorPos);
    setBioContent(before + '[i]texto em itálico[/i]' + after);
  };

  const insertUnderlineTag = () => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || bioContent.length;
    const before = bioContent.substring(0, cursorPos);
    const after = bioContent.substring(cursorPos);
    setBioContent(before + '[u]texto sublinhado[/u]' + after);
  };

  const [showColorMenu, setShowColorMenu] = useState(false);

  const colors = [
    { name: 'red', label: 'Vermelho', color: '#ef4444' },
    { name: 'blue', label: 'Azul', color: '#3b82f6' },
    { name: 'green', label: 'Verde', color: '#22c55e' },
    { name: 'yellow', label: 'Amarelo', color: '#eab308' },
    { name: 'purple', label: 'Roxo', color: '#a855f7' },
    { name: 'pink', label: 'Rosa', color: '#ec4899' },
    { name: 'orange', label: 'Laranja', color: '#f97316' },
    { name: 'cyan', label: 'Ciano', color: '#06b6d4' },
    { name: 'gold', label: 'Dourado', color: '#fbbf24' },
    { name: 'white', label: 'Branco', color: '#ffffff' },
    { name: 'gray', label: 'Cinza', color: '#6b7280' },
  ];

  const insertColorTag = (colorName: string) => {
    const textarea = document.getElementById('bio-content') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || bioContent.length;
    const before = bioContent.substring(0, cursorPos);
    const after = bioContent.substring(cursorPos);
    setBioContent(before + `[${colorName}]texto colorido[/${colorName}]` + after);
    setShowColorMenu(false);
  };

  // Se não tiver conteúdo e não for o dono, não mostrar nada
  if (!bioContent && !isOwner) {
    return null;
  }

  const parsedContent = parseContent(bioContent);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Sobre Mim
        </CardTitle>
        {isOwner && !isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Editor de Texto com BBCode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="bio-content" className="text-sm font-medium">
                  Descrição
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar' : 'Preview'}
                </Button>
              </div>

              {/* Barra de Ferramentas de Formatação */}
              <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertBoldTag}
                  title="Negrito"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertItalicTag}
                  title="Itálico"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertUnderlineTag}
                  title="Sublinhado"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                {/* Menu de Cores */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorMenu(!showColorMenu)}
                    title="Cor"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                  
                  {showColorMenu && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-10 grid grid-cols-4 gap-1 min-w-[200px]">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => insertColorTag(color.name)}
                          className="p-2 rounded hover:bg-muted transition-colors flex flex-col items-center gap-1"
                          title={color.label}
                        >
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: color.color }}
                          />
                          <span className="text-xs">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-l mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertImageTag}
                  title="Inserir Imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Textarea
                id="bio-content"
                placeholder="Escreva sobre você... Use as ferramentas acima para formatar"
                value={bioContent}
                onChange={(e) => setBioContent(e.target.value.slice(0, 2000))}
                rows={10}
                className="resize-none font-mono text-sm"
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>BBCode: [b]negrito[/b] [i]itálico[/i] [u]sublinhado[/u] [red]vermelho[/red] [img]url[/img]</span>
                <span>{bioContent.length}/2000 caracteres</span>
              </div>
            </div>

            {/* Preview */}
            {showPreview && bioContent && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview:</h4>
                <div className="rounded-lg border bg-muted/20 p-4 min-h-[100px]">
                  {parsedContent.map((part, index) => (
                    part.type === 'text' ? (
                      <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed inline">
                        {part.content}
                      </p>
                    ) : (
                      <div key={index} className="relative w-full max-w-md h-48 my-3">
                        <Image
                          src={part.content}
                          alt="Bio image"
                          fill
                          className="object-contain"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
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
          <div className="space-y-4">
            {bioContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {parsedContent.map((part, index) => (
                  part.type === 'text' ? (
                    <p 
                      key={index} 
                      className="whitespace-pre-wrap text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: processTextFormatting(part.content) }}
                    />
                  ) : (
                    <div key={index} className="relative w-full max-w-2xl h-64 my-4">
                      <Image
                        src={part.content}
                        alt="Bio"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )
                ))}
              </div>
            ) : (
              isOwner && (
                <div className="text-center py-8 text-muted-foreground">
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