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
import {
  formatAddressLine,
  readSellerPickupLocation,
  type SellerAddress,
} from "@/lib/api/address";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useEffect } from "react";

type PickupLocationResponse = {
  data: SellerAddress;
};

const pickupFetchOptions = { silentStatuses: [404] };

type CheckoutPickupLocationDisplayProps = {
  sellerId: string;
  onLocationLoaded: (id: string | null) => void;
};

export function CheckoutPickupLocationDisplay({
  sellerId,
  onLocationLoaded,
}: CheckoutPickupLocationDisplayProps) {
  const url = readSellerPickupLocation(sellerId);
  const { data, isLoading, error } = useApiQuery<PickupLocationResponse | null>(
    [url],
    url,
    {
      fetchOptions: pickupFetchOptions,
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

  if (error) {
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

  if (!location) {
    return null;
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

export function usePickupAvailable(sellerId: string | null | undefined) {
  const enabled = Boolean(sellerId);
  const url = enabled ? readSellerPickupLocation(sellerId!) : "";
  const { data, isLoading, error } = useApiQuery<PickupLocationResponse | null>(
    enabled ? [url] : [],
    url,
    {
      enabled,
      fetchOptions: pickupFetchOptions,
      retry: false,
    },
  );

  const available =
    enabled && !isLoading && !error && Boolean(data?.data);

  return { available, isLoading: enabled && isLoading };
}
