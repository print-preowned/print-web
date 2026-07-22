"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NIGERIAN_STATES, type AddressFieldsValues } from "@/lib/address/nigeria";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

type AddressFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  errors: FieldErrors<AddressFieldsValues>;
  stateValue: string;
  onStateChange: (value: string) => void;
  showPhone?: boolean;
  phoneHelpText?: string;
};

export function AddressFields({
  register,
  errors,
  stateValue,
  onStateChange,
  showPhone = true,
  phoneHelpText,
}: AddressFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="line1">Address line 1</Label>
        <Input
          id="line1"
          {...register("line1")}
          placeholder="Street address"
          className={errors.line1 ? "border-destructive" : ""}
        />
        {errors.line1 && (
          <p className="text-sm text-destructive">{String(errors.line1.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input
          id="line2"
          {...register("line2")}
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register("city")}
            placeholder="City"
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{String(errors.city.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={stateValue} onValueChange={onStateChange}>
            <SelectTrigger id="state" className={errors.state ? "border-destructive" : ""}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-destructive">{String(errors.state.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postal_code">Postal code (optional)</Label>
        <Input id="postal_code" {...register("postal_code")} placeholder="Postal code" />
      </div>

      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone</Label>
          <Input
            id="phone_number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("phone_number")}
            placeholder="08012345678 or +14155552671"
            className={errors.phone_number ? "border-destructive" : ""}
          />
          {phoneHelpText && (
            <p className="text-sm text-muted-foreground">{phoneHelpText}</p>
          )}
          {errors.phone_number && (
            <p className="text-sm text-destructive">{String(errors.phone_number.message)}</p>
          )}
        </div>
      )}
    </div>
  );
}
