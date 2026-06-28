import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/app/(auth)/change-password/form";

export default function AdminChangePasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set Your Password</CardTitle>
        <CardDescription>
          You must choose a new password before continuing to the admin portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm redirectTo="/admin/books" isFirstLogin />
      </CardContent>
    </Card>
  );
}
