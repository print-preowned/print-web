"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, LoginResponse } from "@/lib/api/auth";
import { useMutation } from "@tanstack/react-query";
import { FieldValues, useForm } from "react-hook-form";
import { setCookie } from "@/lib/cookies";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const { setToken } = useAuth();
  const { handleSubmit, register, reset } = useForm();
  const { mutate, isPending } = useMutation<LoginResponse, Error, {}>({
    onSuccess: (response) => {
      reset();
      if (response?.data && response?.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        setToken(response.token);
        setCookie("authHeader", response.token, 7);
        toast.success("Account created. You're signed in.");
        router.push("/");
      }
    },
  });

  const handleSignup = (data: FieldValues) => {
    const payload = {
      first_name: data.first_name as string,
      last_name: data.last_name as string,
      email: data.email as string,
      password: data.password as string,
    };

    mutate(signup(payload));
  };

  return (
    <form onSubmit={handleSubmit(handleSignup)}>
      <div className="grid gap-6">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              placeholder="Nkem"
              {...register("first_name", { required: true })}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              placeholder="Owoh"
              {...register("last_name", { required: true })}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email", { required: true })}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password", { required: true })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            Register
          </Button>
        </div>
      </div>
    </form>
  );
}
