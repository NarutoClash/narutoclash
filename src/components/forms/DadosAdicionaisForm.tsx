'use client';

import React, { useState } from 'react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Componente para coletar dados adicionais do usuário
 * Melhora a taxa de aprovação de pagamentos no Mercado Pago
 */
export function DadosAdicionaisForm({ userProfile, onComplete }: {
  userProfile: any;
  onComplete?: () => void;
}) {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    telefone: userProfile?.telefone || '',
    cpf: userProfile?.cpf || '',
    cep: userProfile?.cep || '',
    endereco: userProfile?.endereco || '',
    numero: userProfile?.numero || '',
    complemento: userProfile?.complemento || '',
    cidade: userProfile?.cidade || '',
    estado: userProfile?.estado || '',
  });

  // Máscaras de formatação
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
  };

  const handleChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'telefone') formattedValue = formatTelefone(value);
    if (field === 'cpf') formattedValue = formatCPF(value);
    if (field === 'cep') formattedValue = formatCEP(value);
    if (field === 'estado') formattedValue = value.toUpperCase().substring(0, 2);

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Buscar endereço pelo CEP
  const buscarCEP = async () => {
    const cepNumeros = formData.cep.replace(/\D/g, '');
    
    if (cepNumeros.length !== 8) {
      toast({
        variant: 'destructive',
        title: 'CEP Inválido',
        description: 'Digite um CEP válido com 8 dígitos',
      });
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          variant: 'destructive',
          title: 'CEP Não Encontrado',
          description: 'Verifique se o CEP está correto',
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));

      toast({
        title: 'Endereço Encontrado!',
        description: 'Dados preenchidos automaticamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Buscar CEP',
        description: 'Tente novamente mais tarde',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !supabase) return;

    // Validações básicas
    if (!formData.telefone || !formData.cpf) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Telefone e CPF são obrigatórios',
      });
      return;
    }

    const cpfNumeros = formData.cpf.replace(/\D/g, '');
    if (cpfNumeros.length !== 11) {
      toast({
        variant: 'destructive',
        title: 'CPF Inválido',
        description: 'Digite um CPF válido com 11 dígitos',
      });
      return;
    }

    const telefoneNumeros = formData.telefone.replace(/\D/g, '');
    if (telefoneNumeros.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Telefone Inválido',
        description: 'Digite um telefone válido com DDD',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telefone: telefoneNumeros,
          cpf: cpfNumeros,
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          complemento: formData.complemento,
          cidade: formData.cidade,
          estado: formData.estado,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: '✅ Dados Salvos!',
        description: 'Suas informações foram atualizadas com sucesso',
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Erro ao salvar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: error.message || 'Tente novamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Shield className="h-5 w-5" />
          Complete Seus Dados
        </CardTitle>
        <CardDescription className="text-gray-400">
          Essas informações aumentam a taxa de aprovação dos seus pagamentos
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-gray-300">
            <strong className="text-blue-400">Segurança:</strong> Seus dados são usados apenas para
            validação de pagamentos e não serão compartilhados.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Telefone e CPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone" className="text-gray-300">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                className="bg-black/20 border-gray-600"
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-gray-300">
                CPF <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                className="bg-black/20 border-gray-600"
                required
              />
            </div>
          </div>

          {/* CEP */}
          <div>
            <Label htmlFor="cep" className="text-gray-300">CEP (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                className="bg-black/20 border-gray-600"
              />
              <Button
                type="button"
                variant="outline"
                onClick={buscarCEP}
                disabled={formData.cep.replace(/\D/g, '').length !== 8}
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Endereço e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="endereco" className="text-gray-300">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, Avenida..."
                value={formData.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                className="bg-black/20 border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="numero" className="text-gray-300">Número</Label>
              <Input
                id="numero"
                placeholder="123"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                className="bg-black/20 border-gray-600"
              />
            </div>
          </div>

          {/* Complemento */}
          <div>
            <Label htmlFor="complemento" className="text-gray-300">Complemento</Label>
            <Input
              id="complemento"
              placeholder="Apto, Bloco..."
              value={formData.complemento}
              onChange={(e) => handleChange('complemento', e.target.value)}
              className="bg-black/20 border-gray-600"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade" className="text-gray-300">Cidade</Label>
              <Input
                id="cidade"
                placeholder="São Paulo"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className="bg-black/20 border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="estado" className="text-gray-300">Estado</Label>
              <Input
                id="estado"
                placeholder="SP"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                className="bg-black/20 border-gray-600"
                maxLength={2}
              />
            </div>
          </div>

          {/* Botão de Salvar */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Salvar Dados
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
