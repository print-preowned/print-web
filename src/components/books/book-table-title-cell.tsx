import { ImageIcon } from "lucide-react";

type BookTableTitleCellProps = {
  title: string;
  image?: string | null;
};

export function BookTableTitleCell({ title, image }: BookTableTitleCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-4" aria-hidden />
          </div>
        )}
      </div>
      <span className="min-w-0 truncate font-medium">{title}</span>
    </div>
  );
}
