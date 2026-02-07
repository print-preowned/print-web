"use client"

import { GalleryVerticalEnd } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";

export default function AuthLayout({ children }: React.ComponentProps<"div">) {
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
        {children}
      </FormProvider>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
