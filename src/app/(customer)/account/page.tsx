"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateSellerForm } from "@/components/businesses/create-form";

export default function AccountPage() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6 md:gap-6 md:py-14">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your account settings and create a storefront
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Manage saved delivery addresses for your orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/account/addresses">Manage addresses</Link>
              </Button>
            </CardContent>
          </Card>

          {!isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Create storefront</CardTitle>
                <CardDescription>
                  Open a storefront. Additional shops reuse the same legal
                  profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsCreating(true)}>
                  Create storefront
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create storefront</CardTitle>
                <CardDescription>
                  Fill in the details for this storefront.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSellerForm
                  onCancel={() => setIsCreating(false)}
                  submitLabel="Create storefront"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
