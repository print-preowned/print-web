export type PaginatedResponse<T> = {
    status_code: number;
    message: string;
    data: T[];
    pagination?: {
      page: number;
      size: number;
      total_pages: number;
      total_results: number;
    } | null;
  };