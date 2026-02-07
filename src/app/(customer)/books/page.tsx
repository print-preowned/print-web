"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Star, ShoppingCart, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dummy data for books
const dummyBooks = [
  {
    id: "1",
    title: "The Art of Modern Fiction",
    author: "Jane Smith",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    price: 24.99,
    rating: 4.8,
    reviews: 1243,
    genre: "Fiction",
    synopsis: "A captivating exploration of contemporary storytelling techniques.",
  },
  {
    id: "2",
    title: "Digital Transformation Guide",
    author: "Michael Chen",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    price: 29.99,
    rating: 4.9,
    reviews: 892,
    genre: "Business",
    synopsis: "Essential strategies for navigating the digital age.",
  },
  {
    id: "3",
    title: "Culinary Adventures",
    author: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    price: 19.99,
    rating: 4.7,
    reviews: 567,
    genre: "Cookbook",
    synopsis: "Journey through flavors and cultures from around the world.",
  },
  {
    id: "4",
    title: "Mystery of the Lost City",
    author: "David Williams",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
    price: 22.99,
    rating: 4.6,
    reviews: 1201,
    genre: "Mystery",
    synopsis: "An ancient secret hidden in the depths of an abandoned city.",
  },
  {
    id: "5",
    title: "The Science of Success",
    author: "Emily Rodriguez",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    price: 27.99,
    rating: 4.9,
    reviews: 2103,
    genre: "Self-Help",
    synopsis: "Evidence-based strategies for achieving your goals.",
  },
  {
    id: "6",
    title: "Fantasy Realms",
    author: "James Anderson",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
    price: 25.99,
    rating: 4.8,
    reviews: 3456,
    genre: "Fantasy",
    synopsis: "Embark on an epic journey through magical worlds.",
  },
  {
    id: "7",
    title: "Historical Perspectives",
    author: "Maria Garcia",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    price: 23.99,
    rating: 4.7,
    reviews: 987,
    genre: "History",
    synopsis: "Uncover the untold stories of the past.",
  },
  {
    id: "8",
    title: "Poetry of the Soul",
    author: "Robert Taylor",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    price: 18.99,
    rating: 4.9,
    reviews: 654,
    genre: "Poetry",
    synopsis: "A collection of heartfelt verses that touch the soul.",
  },
];

const genres = ["All", "Fiction", "Business", "Cookbook", "Mystery", "Self-Help", "Fantasy", "History", "Poetry"];

export default function BooksPage() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const filteredBooks = dummyBooks.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === "All" || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Books Grid */}
      <div className="py-8">
        {filteredBooks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No books found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredBooks.map((book) => (
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
                  <Link href={`/authors/${book.author.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardDescription className="hover:text-primary transition-colors">
                      {book.author}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

