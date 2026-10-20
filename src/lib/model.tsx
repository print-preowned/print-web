export type BaseResponse<T> = {
  status_code: number;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = {
  status_code: number;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    size: number;
    totalPages: number;
    totalResults: number;
  } | null;
};