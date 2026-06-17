export type ColorVariant = {
  color: string;
  hex?: string | null;
  images?: string[];
};

export type ProductWithVariants = {
  colors?: string[];
  images?: string[];
  variants?: ColorVariant[] | null;
};

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#000000",
  white: "#f5f5f5",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  red: "#E63946",
  navy: "#1E3A8A",
  blue: "#3B82F6",
  green: "#10B981",
  olive: "#6B7A41",
  beige: "#C9B99A",
  khaki: "#C3B091",
  charcoal: "#36454F",
  burgundy: "#800020",
  maroon: "#800000",
  "dark brown": "#5C4033",
  brown: "#8B5E3C",
  "forest green": "#228B22",
  cream: "#F5F1E8",
  offwhite: "#F5F5F0",
  "off white": "#F5F5F0",
  silver: "#C0C0C0",
  gold: "#D4AF37",
};

export function normalizeColorName(value: string): string {
  return value.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

export function slugifyColor(value: string): string {
  return normalizeColorName(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getColorHex(name: string, explicitHex?: string | null): string {
  if (explicitHex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(explicitHex)) return explicitHex;
  return COLOR_HEX_MAP[normalizeColorName(name)] ?? "#888888";
}

function inferVariantImages(color: string, allImages: string[], totalColors: number): string[] {
  if (allImages.length === 0) return [];
  if (totalColors === 1) return allImages;

  const slug = slugifyColor(color);
  const compact = slug.replace(/-/g, "");
  const tokens = normalizeColorName(color).split(" ").filter(Boolean);

  const matches = allImages.filter((img) => {
    const lower = img.toLowerCase();
    return (
      lower.includes(slug) ||
      lower.includes(compact) ||
      tokens.some((token) => token.length > 2 && lower.includes(token))
    );
  });

  return matches.length > 0 ? matches : allImages;
}

export function deriveProductVariants(product: ProductWithVariants): ColorVariant[] {
  const allImages = product.images ?? [];
  const explicitVariants = (product.variants ?? [])
    .filter((variant): variant is ColorVariant => Boolean(variant?.color))
    .map((variant) => ({
      color: variant.color,
      hex: variant.hex ?? null,
      images: variant.images?.length ? variant.images : inferVariantImages(variant.color, allImages, product.colors?.length ?? 0),
    }));

  if (explicitVariants.length > 0) return explicitVariants;

  const colors = (product.colors ?? []).filter(Boolean);
  return colors.map((color) => ({
    color,
    hex: getColorHex(color),
    images: inferVariantImages(color, allImages, colors.length),
  }));
}
