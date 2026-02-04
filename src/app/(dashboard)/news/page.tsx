import { PageHeader } from "@/components/common/page-header";

export default function NewsPage() {
  return (
    <div>
      <PageHeader
        title="News"
        description="Fique por dentro das últimas notícias e atualizações do Naruto Clash."
      />
      <div className="mt-8">
        <p>Ainda não há notícias. Volte em breve!</p>
      </div>
    </div>
  );
}
