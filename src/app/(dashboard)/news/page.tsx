import { PageHeader } from "@/components/common/page-header";
import { supabase } from "@/lib/supabase";
import { NewsClient } from "@/app/(dashboard)/news/news-client";

async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar notícias:', error);
    return [];
  }
  
  return data || [];
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <div>
      <PageHeader
        title="News"
        description="Fique por dentro das últimas notícias e atualizações do Naruto Clash."
      />
      <NewsClient news={news} />
    </div>
  );
}