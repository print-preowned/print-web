import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { LoginForm } from "./form";
import Link from "next/link";
import { sectionUrl } from "@/lib/sections";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; redirect?: string }> }) {
  const { reason, redirect } = await searchParams;
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome</CardTitle>
        <CardDescription>Login to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          section="store"
          reason={reason}
          redirect={redirect}
          forgotPasswordHref="/forgot-password"
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm mt-6">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot password?
        </Link>
        <div>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
        <div className="text-muted-foreground">
          Selling on PRINT?{" "}
          <a href={sectionUrl("seller", "/seller/login")} className="underline underline-offset-4">
            Sign in to your store
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
