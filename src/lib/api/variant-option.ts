import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type VariantOption = {
  id: string;
  variant_type_id: string;
  value: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readVariantOptions(
  params?: ReadParams & { variant_type_id?: string },
) {
  const query = buildQueryParams(params);
  if (params?.variant_type_id) {
    query.variant_type_id = params.variant_type_id;
  }
  return generateUrl("/variant-option/read", query);
}
