import { PageHeader } from "@/components/common/page-header";
import { NewsClient } from "@/app/(dashboard)/news/news-client";

// FORÇA o Next.js a NÃO cachear esta página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NewsPage() {
  return (
    <div>
      <PageHeader
        title="News"
        description="Fique por dentro das últimas notícias e atualizações do Naruto Clash."
      />
      <NewsClient />
    </div>
  );
}