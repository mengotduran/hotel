/** URL-safe slug from a label, with accents folded down. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Appends -2, -3 … until the slug is free. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "item";
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
