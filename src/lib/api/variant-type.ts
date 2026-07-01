import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type VariantType = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readVariantTypes(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/variant-type/read", query);
}
