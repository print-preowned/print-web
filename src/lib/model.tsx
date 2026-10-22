export type BaseResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = {
  statusCode: number;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    size: number;
    totalPages: number;
    totalResults: number;
  } | null;
};