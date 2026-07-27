import z from "zod";

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** Nigerian local/international without +, or E.164 (+…) numbers. */
export const PHONE_INPUT_PATTERN =
  /^(?:\+[1-9]\d{6,14}|234[789]\d{9}|0[789]\d{9})$/;

export function normalizePhoneInput(value: string) {
  return value.trim().replace(/[\s-]/g, "");
}

export function normalizePhoneToE164(compact: string): string {
  if (/^0[789]\d{9}$/.test(compact)) {
    return `+234${compact.slice(1)}`;
  }
  if (/^234[789]\d{9}$/.test(compact)) {
    return `+${compact}`;
  }
  if (/^\+[1-9]\d{6,14}$/.test(compact)) {
    return compact;
  }
  throw new Error("Invalid phone number");
}

function phoneSchema() {
  return z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform(normalizePhoneInput)
    .refine((value) => PHONE_INPUT_PATTERN.test(value), {
      message: "Enter a valid phone number",
    })
    .transform(normalizePhoneToE164);
}

export const addressFieldsSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required").max(128),
  line2: z.string().trim().max(128).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(128),
  state: z.enum(NIGERIAN_STATES, { message: "Select a valid state" }),
  postal_code: z.string().trim().max(8).optional().or(z.literal("")),
  phone_number: phoneSchema(),
});

export type AddressFieldsValues = z.infer<typeof addressFieldsSchema>;

function optionalPhoneField() {
  return z
    .string()
    .trim()
    .max(16)
    .refine((value) => !value || PHONE_INPUT_PATTERN.test(normalizePhoneInput(value)), {
      message: "Enter a valid phone number",
    })
    .transform((value) => {
      if (!value) return "";
      return normalizePhoneToE164(normalizePhoneInput(value));
    });
}

export const businessAddressFieldsSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required").max(128),
  line2: z.string().trim().max(128).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(128),
  state: z.enum(NIGERIAN_STATES, { message: "Select a valid state" }),
  postal_code: z.string().trim().max(8).optional().or(z.literal("")),
  phone_number: optionalPhoneField(),
});

export type BusinessAddressFieldsValues = z.infer<typeof businessAddressFieldsSchema>;

export const userAddressFormSchema = addressFieldsSchema.extend({
  label: z.string().trim().max(32).optional().or(z.literal("")),
  recipient_name: z.string().trim().min(1, "Recipient name is required").max(64),
});

export type UserAddressFormValues = z.infer<typeof userAddressFormSchema>;

export const businessLocationFormSchema = businessAddressFieldsSchema.extend({
  label: z.string().trim().min(1, "Location name is required").max(32),
  pickup_enabled: z.boolean(),
});

export type BusinessLocationFormValues = z.output<typeof businessLocationFormSchema>;
