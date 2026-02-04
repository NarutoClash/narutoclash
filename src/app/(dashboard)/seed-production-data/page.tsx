'use client';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import seedData from '@/../docs/seed-data.json';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { redirect } from 'next/navigation';

const DataDisplayCard = ({ title, data }: { title: string; data: any }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Textarea readOnly value={JSON.stringify(data, null, 2)} className="h-64 font-mono text-xs" />
    </CardContent>
  </Card>
);

export default function SeedProductionDataPage() {

  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
     redirect('/status');
  }

  return (
    <div>
      <PageHeader
        title="Guia para Popular o Banco de Dados"
        description="Copie o conteúdo JSON abaixo e cole no seu banco de dados Firestore para popular os dados iniciais do jogo."
      />
      <Alert className="my-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Instruções</AlertTitle>
        <AlertDescription>
            <ol className="list-decimal list-inside space-y-2">
                <li>Abra seu <a href="https://console.firebase.google.com/project/studio-741083508-a6085/firestore/data" target="_blank" rel="noopener noreferrer" className="text-primary underline">Console do Firestore</a>.</li>
                <li>Para cada seção abaixo, crie uma coleção com o nome indicado (ex: `missions`).</li>
                <li>Copie o JSON e adicione cada objeto como um novo documento na coleção correspondente. Use um ID automático.</li>
                <li>Para o 'World Boss', crie a coleção `worldBosses` e um documento com o ID `current_boss`.</li>
            </ol>
        </AlertDescription>
      </Alert>
      <div className="space-y-8">
        <DataDisplayCard title="Missões (Coleção: missions)" data={seedData.missions} />
        <DataDisplayCard title="Armas (Coleção: weapons)" data={seedData.weapons} />
        <DataDisplayCard title="Equipamentos (Coleção: equipments)" data={seedData.equipments} />
        <DataDisplayCard title="Invocações (Coleção: summons)" data={seedData.summons} />
        <DataDisplayCard title="Menu Ichiraku (Coleção: ichiraku)" data={seedData.ichirakuMenu} />
        <DataDisplayCard title="Chefes (Coleção: bosses)" data={seedData.bosses} />
        <DataDisplayCard title="Dōjutsu (Coleção: dojutsu)" data={seedData.dojutsu} />
        <DataDisplayCard title="Chefe Mundial Inicial (Coleção: worldBosses, Documento: current_boss)" data={seedData.initialWorldBoss} />
      </div>
    </div>
  );
}
