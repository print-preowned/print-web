import z from "zod";

export const schema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z.string().optional(),
  synopsis: z.string().min(1, "Synopsis is required"),
});

export type CreateBookFormSchema = z.infer<typeof schema>;
