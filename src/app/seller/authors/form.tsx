import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { Author } from "@/lib/api/author";

export const schema = z.object({
  key_names: z.string().min(1, "Family name is required"),
  names_before_key: z.string().optional(),
  about: z.string().min(1, "About is required"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.string().optional(),
});

export function AuthorForm({ author }: { author: Author | undefined }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="names_before_key">Given names</Label>
          <Input
            id="names_before_key"
            name="names_before_key"
            placeholder="Chinua"
            defaultValue={author?.name.namesBeforeKey ?? ""}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="key_names">Family name</Label>
          <Input
            id="key_names"
            name="key_names"
            placeholder="Achebe"
            defaultValue={author?.name.keyNames}
            required
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
