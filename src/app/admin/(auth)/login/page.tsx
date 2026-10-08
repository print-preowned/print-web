import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason: string }> }) {
  const { reason } = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome</CardTitle>
        <CardDescription>Login to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm isPlatform reason={reason} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm mt-6">
        <div>
          Platform access is by invitation only. Contact an administrator for access.
        </div>
      </CardFooter>
    </Card>
  );
}
