export const INVENTORY_CONDITIONS = [
  {
    value: "New",
    description:
      "A pristine, unread copy straight from the publisher. It has absolutely zero defects, no shelf wear, and crisp, sharp edges.",
  },
  {
    value: "Like New",
    description:
      "An unread or flawless copy that shows only minor signs of long-term storage or handling. This is the correct tier for unsold warehouse stock with faint scuffs or minor shelf wear.",
  },
  {
    value: "Very Good",
    description:
      "A carefully handled book that has been read but remains clean and structurally tight. It can have small cosmetic flaws like a tiny spine crease, a remainder mark, or slight page yellowing.",
  },
  {
    value: "Good",
    description:
      "A well-read copy that is fully intact but shows obvious signs of wear. It may have a creased cover, moderate corner curling, or minor handwritten notes and highlighting.",
  },
  {
    value: "Acceptable",
    description:
      "A heavily worn copy that is still fully readable. It can feature significant aesthetic damage, such as a torn dust jacket, heavy annotations, water stains, or a warped spine.",
  },
] as const;

export type InventoryCondition = (typeof INVENTORY_CONDITIONS)[number]["value"];

export const INVENTORY_CONDITION_VALUES =
  INVENTORY_CONDITIONS.map((condition) => condition.value);
