"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessForm } from "@/app/seller/businesses/form";
import { useAuth } from "@/lib/auth/context";

export function CreateBusinessSection() {
  const { context } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Don't show if already in BUSINESS context
  if (context === "BUSINESS") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Account</CardTitle>
          <CardDescription>
            You are currently using a business account. Switch to customer context to create a new business.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Business</CardTitle>
          <CardDescription>
            Create a new business account to start managing your business operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsCreating(true)}>
            Create Business
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Business</CardTitle>
        <CardDescription>
          Fill in the details to create your business account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BusinessForm 
          onCancel={() => setIsCreating(false)}
          submitLabel="Create Business"
        />
      </CardContent>
    </Card>
  );
}

