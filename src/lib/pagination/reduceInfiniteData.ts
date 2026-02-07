import { InfiniteData } from "@tanstack/react-query";
import { PaginatedResponse } from "../model";

export default function reduceInfiniteData<T>(
  pages?: InfiniteData<PaginatedResponse<T>> | null
): T[] {
  if (!pages) {
    return [];
  }

  // track all ids while assembling the list to deduplicate
  const idMap: Record<string, boolean> = {};

  return pages.pages.reduce(
    (acc, next) =>
      acc.concat(
        next.data.filter((item) => {
          // skip anything that isn't a predictable object
          if (typeof item !== "object") {
            return true;
          }

          const id = (item as Record<string, unknown>)["id"];

          // not all items have ids, don't bother in that case
          if (typeof id !== "string") {
            return true;
          }

          // we've seen this item before, skip
          if (idMap[id]) {
            return false;
          }

          // add the item, but don't show it again
          return (idMap[id] = true);
        })
      ),
    [] as T[]
  );
}
