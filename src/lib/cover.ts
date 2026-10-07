export function firstImage(images?: string[] | null): string | null {
  return images?.find((item) => item.trim()) ?? null;
}
