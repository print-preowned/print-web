import { MutationVariables } from "@/providers/QueryProvider";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

/**
 * Standard write hook: pass API descriptors from lib/api ({ endpoint, method, body }).
 * Uses QueryProvider's default mutationFn (apiFetch).
 */
export function useApiMutation<Result>(
  options?: UseMutationOptions<Result, Error, MutationVariables>,
) {
  const { mutate, mutateAsync, isPending, error } = useMutation<
    Result,
    Error,
    MutationVariables
  >(options ?? {});

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
}
