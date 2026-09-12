import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="grid min-h-screen items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 items-center text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-xl text-black/70 dark:text-white/70">
          {t("subtitle")}
        </p>
        <p className="text-sm text-black/50 dark:text-white/50">
          {t("description")}
        </p>
      </main>
    </div>
  );
}
