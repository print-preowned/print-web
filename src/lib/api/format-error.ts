type ValidationIssue = {
  type?: string;
  loc?: (string | number)[];
  msg?: string;
  input?: unknown;
};

/** Turn FastAPI `detail` (string or validation array) into user-facing text. */
export function formatApiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim() !== "") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const formatted = detail
      .map((issue) => {
        const entry = issue as ValidationIssue;
        const field =
          entry.loc && entry.loc.length > 1
            ? entry.loc.slice(1).join(".")
            : "field";
        return `${field} - ${entry.msg ?? "Validation error"}`;
      })
      .join(", ");
    return formatted ? `Validation error: ${formatted}` : fallback;
  }

  if (typeof detail === "string") {
    return fallback;
  }

  return fallback;
}
