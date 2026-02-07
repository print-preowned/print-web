import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { Author } from "@/lib/api/author";

export const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional(),
  about: z.string().min(1, "About is required"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.string().optional(),
});

export function AuthorForm({ author }: { author: z.infer<typeof schema> | undefined }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <form className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="John"
              defaultValue={author?.first_name}
              required
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              placeholder="Doe"
              defaultValue={author?.last_name}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="middle_name">Middle Name (Optional)</Label>
          <Input
            id="middle_name"
            name="middle_name"
            placeholder="Michael"
            defaultValue={author?.middle_name ?? ""}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/image.jpg"
            defaultValue={author?.image ?? ""}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            name="about"
            placeholder="A brief biography of the author..."
            defaultValue={author?.about}
            rows={5}
            required
          />
        </div>
      </form>
    </div>
  );
}

