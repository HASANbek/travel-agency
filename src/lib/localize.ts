import { AdminLang } from "@/lib/admin-i18n";

type NameFields = { name: string; nameRu?: string | null; nameEn?: string | null };

export function localizedName(entity: NameFields, lang: AdminLang): string {
  if (lang === "ru" && entity.nameRu) return entity.nameRu;
  if (lang === "en" && entity.nameEn) return entity.nameEn;
  return entity.name;
}

type DescriptionFields = {
  description?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
};

export function localizedDescription(
  entity: DescriptionFields,
  lang: AdminLang
): string | null {
  if (lang === "ru" && entity.descriptionRu) return entity.descriptionRu;
  if (lang === "en" && entity.descriptionEn) return entity.descriptionEn;
  return entity.description ?? null;
}
