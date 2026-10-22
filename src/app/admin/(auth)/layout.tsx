"use client"

import { ReactNode } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { ApiStatusBanner } from "@/components/api-status-banner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const methods = useForm();
  
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        PRINT
      </a>
      <FormProvider {...methods}>
        <div className="w-full max-w-sm">
          <ApiStatusBanner />
        </div>
        {children}
      </FormProvider>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
