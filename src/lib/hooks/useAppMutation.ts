import { MutationVariables } from "@/providers/QueryProvider";
import { useMutation } from "@tanstack/react-query";

export function useAppMutation<Result>() {
  const { mutate, mutateAsync, isPending, error } = useMutation<
    Result,
    Error,
    MutationVariables
  >({});

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
}
