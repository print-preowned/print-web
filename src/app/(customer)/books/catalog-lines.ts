import type { CatalogWork } from "@customer/api";

export function catalogWorkLines(work: CatalogWork): string[] {
  const series = (work.seriesMemberships ?? [])
    .map((membership) =>
      membership.seriesNumber
        ? `${membership.title} #${membership.seriesNumber}`
        : membership.title,
    )
    .filter(Boolean);
  const containers = (work.containedIn ?? [])
    .map((container) => container.title)
    .filter(Boolean);
  return [
    ...(series.length ? [series.join(" · ")] : []),
    ...(containers.length ? [`In ${containers.join(", ")}`] : []),
  ];
}
