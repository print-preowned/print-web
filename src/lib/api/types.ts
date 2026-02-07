/**
 * Base filter interface for resource filtering
 * Can be extended by specific resource filters
 */
export interface QueryFilter {
  search?: string;
  status?: string;
  created_from?: string;
  created_to?: string;
}

/**
 * Parameters for paginated read operations
 */
export interface ReadParams {
  page?: number;
  size?: number;
  filter?: QueryFilter;
}

export interface PageParams {
  page: number;
  size: number;
  filter?: QueryFilter;
}

/**
 * Builds query parameters from pagination and filter params
 * @param params - Read parameters containing page, size, and filter
 * @returns Record of query parameters ready for URL generation
 */
export function buildQueryParams(
  params?: ReadParams
): Record<string, string | number | undefined | null> {
  const queryParams: Record<string, string | number | undefined | null> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.size) queryParams.size = params.size;

  if (params?.filter) {
    // Loop through all filter properties and add non-undefined values
    Object.entries(params.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams[key] = value;
      }
    });
  }

  return queryParams;
}
