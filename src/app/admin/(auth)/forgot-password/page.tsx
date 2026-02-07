import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/form";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/admin/login" className="underline underline-offset-4">
          Login
        </Link>
      </CardFooter>
    </Card>
  );
}
