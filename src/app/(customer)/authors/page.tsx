"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { BookOpen, Users } from "lucide-react";

// Dummy data for authors
const dummyAuthors = [
  {
    id: "jane-smith",
    name: "Jane Smith",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    bio: "Award-winning fiction author with over 20 published novels.",
    booksCount: 15,
    followers: 125000,
    genres: ["Fiction", "Literary Fiction"],
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Business strategist and thought leader in digital transformation.",
    booksCount: 8,
    followers: 89000,
    genres: ["Business", "Technology"],
  },
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    bio: "Celebrity chef and cookbook author known for innovative recipes.",
    booksCount: 12,
    followers: 210000,
    genres: ["Cookbook", "Food & Drink"],
  },
  {
    id: "david-williams",
    name: "David Williams",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "Master of mystery and suspense with bestselling thriller series.",
    booksCount: 20,
    followers: 350000,
    genres: ["Mystery", "Thriller"],
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    bio: "Life coach and motivational speaker helping millions achieve success.",
    booksCount: 6,
    followers: 450000,
    genres: ["Self-Help", "Personal Development"],
  },
  {
    id: "james-anderson",
    name: "James Anderson",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    bio: "Epic fantasy writer creating immersive worlds and unforgettable characters.",
    booksCount: 10,
    followers: 280000,
    genres: ["Fantasy", "Adventure"],
  },
  {
    id: "maria-garcia",
    name: "Maria Garcia",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    bio: "Historian and researcher bringing forgotten stories to light.",
    booksCount: 7,
    followers: 95000,
    genres: ["History", "Non-Fiction"],
  },
  {
    id: "robert-taylor",
    name: "Robert Taylor",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    bio: "Poet and wordsmith crafting verses that resonate with the soul.",
    booksCount: 5,
    followers: 67000,
    genres: ["Poetry", "Literature"],
  },
];

export default function AuthorsPage() {
  const [search, setSearch] = useState("");

  const filteredAuthors = dummyAuthors.filter((author) =>
    author.name.toLowerCase().includes(search.toLowerCase()) ||
    author.genres.some((genre) => genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="py-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Meet Our Authors</h1>
          <p className="text-muted-foreground">
            Discover the talented writers behind your favorite books
          </p>
        </div>
      </div>

      {/* Authors Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredAuthors.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No authors found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAuthors.map((author) => (
              <Card key={author.id} className="group overflow-hidden transition-all hover:shadow-lg pt-0 pb-2 gap-2 rounded-[4px]">
                <Link href={`/authors/${author.id}`}>
                  <div className="relative aspect-[5/3] overflow-hidden bg-muted">
                    <img
                      src={author.image}
                      alt={author.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <CardHeader>
                  <Link href={`/authors/${author.id}`}>
                    <CardTitle className="hover:text-primary transition-colors">
                      {author.name}
                    </CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-2">{author.bio}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {author.genres.map((genre) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{author.booksCount} books</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{author.followers.toLocaleString()} followers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

