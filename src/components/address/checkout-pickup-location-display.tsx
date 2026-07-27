"use client";

import { MapPin, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  formatAddressLine,
  readBusinessPickupLocation,
  type BusinessAddress,
} from "@/lib/api/address";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useEffect } from "react";

type PickupLocationResponse = {
  data: BusinessAddress;
};

type CheckoutPickupLocationDisplayProps = {
  businessId: string;
  onLocationLoaded: (id: string | null) => void;
};

export function CheckoutPickupLocationDisplay({
  businessId,
  onLocationLoaded,
}: CheckoutPickupLocationDisplayProps) {
  const queryKey = [readBusinessPickupLocation(businessId)];
  const { data, isLoading, error } = useApiQuery<PickupLocationResponse>(
    queryKey,
    readBusinessPickupLocation(businessId),
    {
      retry: false,
    },
  );

  const location = data?.data ?? null;

  useEffect(() => {
    onLocationLoaded(location?.id ?? null);
  }, [location?.id, onLocationLoaded]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return null;
  }

  if (error || !location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pickup location</CardTitle>
          <CardDescription>
            Could not load the seller&apos;s pickup location.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pickup location</CardTitle>
        <CardDescription>
          Collect your order from this store.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium">{location.label}</p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {formatAddressLine(location)}
            {location.country_code && location.country_code !== "NG"
              ? `, ${location.country_code}`
              : ""}
          </span>
        </p>
        {location.phone_number ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" aria-hidden />
            <span>{location.phone_number}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function usePickupAvailable(businessId: string | null | undefined) {
  const enabled = Boolean(businessId);
  const queryKey = enabled ? [readBusinessPickupLocation(businessId!)] : [];
  const { data, isLoading, error } = useApiQuery<PickupLocationResponse>(
    queryKey,
    enabled ? readBusinessPickupLocation(businessId!) : "",
    {
      enabled,
      retry: false,
    },
  );

  const available =
    enabled &&
    !isLoading &&
    !error &&
    Boolean(data?.data);

  return { available, isLoading: enabled && isLoading };
}
