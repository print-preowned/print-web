import { Link } from "lucide-react";
import { Book } from "@/lib/api/book";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";

interface Props {
  book: Book;
}

export function BookCard(props: Props) {
  const { book } = props;

  return (
    <div key={book.id} className="group pt-0 pb-2 gap-2">
      <Link href={`/books/${book.id}`}>
        <div className="relative aspect-[7/8] overflow-hidden bg-muted rounded-[4px] transition-transform duration-300 group-hover:scale-101">
          <img
            src={book.image}
            alt={book.title}
            className="h-full w-full object-cover rounded-[4px]"
          />
          <Badge className="absolute right-2 top-2">{book.genre}</Badge>
        </div>
      </Link>
      <CardHeader className="px-0 pt-2 gap-0">
        <Link href={`/books/${book.id}`}>
          <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
            {book.title}
          </CardTitle>
        </Link>
        <Link
          href={`/authors/${book.authors?.[0]?.id.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <CardDescription className="hover:text-primary transition-colors">
            {book.authors?.[0]?.name}
          </CardDescription>
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-medium">{book.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({book.reviews.toLocaleString()})
            </span>
          </div>
          <span className="text-md font-bold">${book.price}</span>
        </div>
      </CardContent>
    </div>
  );
}
