import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import z from "zod";

export const schema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone_number: z.string().optional(),
  country_code: z.string().optional(),
});

export function UserForm({ user }: { user: z.infer<typeof schema> | undefined }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <form className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" placeholder="Nkem" defaultValue={user?.first_name} required />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" placeholder="Owoh" defaultValue={user?.last_name} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="nkem@example.com" defaultValue={user?.email} required />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" type="tel" defaultValue={user?.phone_number ?? ""} required />
          </div>
        </div>
      </form>
    </div>
  );
}
