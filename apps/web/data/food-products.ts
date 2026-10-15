import { createPublicClient } from "@/lib/supabase/public";

export type FoodProduct = {
  id: string;
  slug: string;
  name: string;
  excerpt: string;
  description: string;
  history?: string;
  characteristics?: string;
  imageUrl?: string;
  imageAlt?: string;
  featured: boolean;
  territory?: { slug: string; name: string; description?: string };
  operators: { slug: string; name: string; note?: string }[];
  experiences: { slug: string; name: string; excerpt?: string }[];
};

type RawProduct = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  description: string | null;
  history: string | null;
  characteristics: string | null;
  image_url: string | null;
  image_alt: string | null;
  featured: boolean | null;
  territory: { slug: string; name: string; description: string | null } | null;
  operator_links: { note: string | null; operator: { slug: string; name: string } | null }[] | null;
  experience_links: { experience: { slug: string; name: string; excerpt: string | null } | null }[] | null;
};

const productSelect = "id,slug,name,excerpt,description,history,characteristics,image_url,image_alt,featured,territory:territories(slug,name,description),operator_links:food_product_operators(note,operator:operators(slug,name)),experience_links:food_product_experiences(experience:experiences(slug,name,excerpt))";

function mapProduct(row: RawProduct): FoodProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    excerpt: row.excerpt ?? "",
    description: row.description ?? "",
    history: row.history ?? undefined,
    characteristics: row.characteristics ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    featured: row.featured ?? false,
    territory: row.territory ? { slug: row.territory.slug, name: row.territory.name, description: row.territory.description ?? undefined } : undefined,
    operators: (row.operator_links ?? []).flatMap(link => link.operator ? [{ ...link.operator, note: link.note ?? undefined }] : []),
    experiences: (row.experience_links ?? []).flatMap(link => link.experience ? [{ ...link.experience, excerpt: link.experience.excerpt ?? undefined }] : []),
  };
}

export async function getPublishedFoodProducts(): Promise<FoodProduct[]> {
  const client = createPublicClient();
  if (!client) return [];
  const { data, error } = await client.from("food_products").select(productSelect).eq("published", true).order("featured", { ascending: false }).order("name");
  if (error) {
    console.error("BIMARIS food products read failed", error.message);
    return [];
  }
  return (data as unknown as RawProduct[]).map(mapProduct);
}

export async function getPublishedFoodProductBySlug(slug: string): Promise<FoodProduct | null> {
  const client = createPublicClient();
  if (!client) return null;
  const { data, error } = await client.from("food_products").select(productSelect).eq("published", true).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("BIMARIS food product detail read failed", error.message);
    return null;
  }
  return data ? mapProduct(data as unknown as RawProduct) : null;
}
