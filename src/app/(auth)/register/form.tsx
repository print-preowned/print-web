"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldValues, useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { handleSubmit, register, reset } = useForm();
  const [isPending, setIsPending] = useState(false);

  const handleSignup = async (data: FieldValues) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
        }),
        credentials: "include",
      });
      const response = await res.json();

      if (!res.ok) {
        toast.error(response.detail ?? "Registration failed");
        return;
      }

      reset();
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      await refreshSession();
      toast.success("Account created. You're signed in.");
      router.push("/");
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      setIsPending(false);
    }
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
