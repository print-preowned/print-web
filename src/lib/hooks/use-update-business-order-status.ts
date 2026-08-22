"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import {
  BusinessOrderDetail,
  OrderFulfillmentStatus,
  OrderSummary,
  updateBusinessOrderStatus,
} from "@/lib/api/order";
import { PaginatedResponse } from "@/lib/model";

type OrderDetailResponse = {
  status_code: number;
  message: string;
  data: BusinessOrderDetail;
};

type UpdateBusinessOrderStatusInput = {
  orderId: string;
  status: OrderFulfillmentStatus;
};

type MutationContext = {
  previousDetail?: OrderDetailResponse;
  previousLists: Array<[QueryKey, PaginatedResponse<OrderSummary> | undefined]>;
};

export function useUpdateBusinessOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: UpdateBusinessOrderStatusInput) => {
      const req = updateBusinessOrderStatus(orderId, status);
      return apiFetch(req.endpoint, {
        method: req.method,
        body: req.body,
      });
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["business-order", orderId] });
      await queryClient.cancelQueries({ queryKey: ["business-orders"] });

      const previousDetail = queryClient.getQueryData<OrderDetailResponse>([
        "business-order",
        orderId,
      ]);
      const previousLists = queryClient.getQueriesData<
        PaginatedResponse<OrderSummary>
      >({ queryKey: ["business-orders"] });

      if (previousDetail?.data) {
        queryClient.setQueryData<OrderDetailResponse>(
          ["business-order", orderId],
          {
            ...previousDetail,
            data: { ...previousDetail.data, status },
          },
        );
      }

      queryClient.setQueriesData<PaginatedResponse<OrderSummary>>(
        { queryKey: ["business-orders"] },
        (current) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((order) =>
              order.id === orderId ? { ...order, status } : order,
            ),
          };
        },
      );

      return { previousDetail, previousLists } satisfies MutationContext;
    },
    onError: (_error, { orderId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["business-order", orderId],
          context.previousDetail,
        );
      }
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: () => {
      toast.success("Order status updated");
    },
    // onSettled: (_data, _error, { orderId }) => {
    //   queryClient.invalidateQueries({ queryKey: ["business-order", orderId] });
    //   queryClient.invalidateQueries({ queryKey: ["business-orders"] });
    // },
  });
}
