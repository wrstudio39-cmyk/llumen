import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getCategories, getSiteSettings } from "@/lib/publicData";

export default async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);
  return (
    <div className="flex min-h-screen flex-col bg-ink-50 dark:bg-ink-950">
      <Header categories={categories} siteName={settings.siteName} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} settings={settings} />
    </div>
  );
}
