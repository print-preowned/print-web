"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signup, platformSignup } from "@/lib/api/auth";
import { readPlatformPrivilegeSets } from "@/lib/api/platform";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FieldValues, useForm, Controller } from "react-hook-form";

export function RegisterForm({ isPlatform = false }: { isPlatform?: boolean }) {
  const { handleSubmit, register, control } = useForm();
  const {mutate} = useMutation<unknown, Error, {}>({});

  // Fetch platform privilege sets if this is a platform registration
  const { data: privilegeSetsData, isLoading: isLoadingPrivilegeSets } = useQuery({
    queryKey: ["platform-privilege-sets"],
    queryFn: () => readPlatformPrivilegeSets({ page: 1, size: 100 }),
    enabled: isPlatform,
  });

  const handleSignup = (data: FieldValues) => {
    if (isPlatform && !data.platform_privilege_set_id) {
      console.error("Platform privilege set ID is required");
      return;
    }

    try {
      let res;
      if (isPlatform) {
        const payload = {
          first_name: data.first_name as string,
          last_name: data.last_name as string,
          email: data.email as string,
          password: data.password as string,
          platform_privilege_set_id: data.platform_privilege_set_id as string,
        };
        res = mutate(platformSignup(payload));
      } else {
        const payload = {
          first_name: data.first_name as string,
          last_name: data.last_name as string,
          email: data.email as string,
          password: data.password as string,
        };
        res = mutate(signup(payload));
      }
      console.log("<==========>", res);
    } catch (error) {
      console.error("Signup error:", error);
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
          {isPlatform && (
            <div className="grid gap-3">
              <Label htmlFor="platform_privilege_set_id">Platform Privilege Set</Label>
              <Controller
                name="platform_privilege_set_id"
                control={control}
                rules={{ required: isPlatform }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingPrivilegeSets}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingPrivilegeSets 
                          ? "Loading privilege sets..." 
                          : "Select a platform privilege set"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {privilegeSetsData?.data?.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          {set.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPlatform && isLoadingPrivilegeSets}>
            Register
          </Button>
        </div>
      </div>
    </form>
  );
}
