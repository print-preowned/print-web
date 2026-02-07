import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { Book } from "@/lib/api/book";

export const schema = z.object({
  title: z.string().min(1, "Title is required"),
  genres: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  synopsis: z.string().min(1, "Synopsis is required"),
  status: z.string().optional(),
});

export function BookForm({ book }: { book: z.infer<typeof schema> | undefined }) {
  const genresString = book?.genres ? (Array.isArray(book.genres) ? book.genres.join(", ") : book.genres) : "";

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="The Great Gatsby"
            defaultValue={book?.title}
            required
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="genres">Genres (comma-separated)</Label>
          <Input
            id="genres"
            name="genres"
            placeholder="Fiction, Classic, Drama"
            defaultValue={genresString}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/image.jpg"
            defaultValue={book?.image}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea
            id="synopsis"
            name="synopsis"
            placeholder="A brief description of the book..."
            defaultValue={book?.synopsis}
            rows={5}
            required
          />
        </div>
      </form>
    </div>
  );
}

