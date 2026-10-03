export type WorkTitle = {
  titlePrefix?: string | null;
  titleWithoutPrefix: string;
  subtitle?: string | null;
  displayTitle: string;
  sortTitle: string;
  displayOverride?: boolean;
};

export function previewWorkTitle(
  titlePrefix: string,
  titleWithoutPrefix: string,
  subtitle: string,
): string {
  const head = [titlePrefix, titleWithoutPrefix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const subtitleText = subtitle.trim();
  if (head && subtitleText) return `${head}: ${subtitleText}`;
  return head || subtitleText;
}
