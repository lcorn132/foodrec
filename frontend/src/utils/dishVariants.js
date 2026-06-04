export function parseDishVariants(name = "") {
  const parts = String(name).split(":");
  if (parts.length < 2 || !parts.slice(1).join(":").includes("/")) {
    return { baseName: String(name || ""), options: [] };
  }
  const baseName = parts[0].trim();
  const options = parts
    .slice(1)
    .join(":")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  return { baseName: baseName || String(name || ""), options };
}

export function makeCartDish(dish, variant = "") {
  const parsed = parseDishVariants(dish?.name);
  const selected = variant || parsed.options[0] || "";
  const baseName = parsed.baseName || dish?.name || "Món ăn";
  return {
    id: dish.id,
    cartKey: selected ? `${dish.id}:${selected}` : String(dish.id),
    name: selected ? `${baseName} - ${selected}` : dish.name,
    baseName,
    variant: selected,
    variantOptions: parsed.options,
    price: dish.price,
    image_url: dish.image_url,
  };
}
