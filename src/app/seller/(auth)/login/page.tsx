import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/form";
import { sectionUrl } from "@/lib/sections";

const REASONS: Record<string, string> = {
  handoff_failed: "That store link has expired. Enter the store again from admin.",
};

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; redirect?: string; invite?: string }>;
}) {
  const { reason, redirect, invite } = await searchParams;
  const notice = reason ? REASONS[reason] : undefined;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign in to your store</CardTitle>
        <CardDescription>
          {invite
            ? "Sign in to accept the invitation and open the store."
            : "Use the account you were invited with."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {notice ? <p className="text-destructive text-sm">{notice}</p> : null}
        <LoginForm
          section="seller"
          reason={reason}
          redirect={redirect}
          inviteToken={invite ?? null}
          forgotPasswordHref="/forgot-password"
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm mt-6">
        <div className="text-muted-foreground">
          Want to start selling?{" "}
          <a href={sectionUrl("store", "/account")} className="underline underline-offset-4">
            Open a store from your account
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
