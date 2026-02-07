import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, TrendingUp, Users, ArrowRight, ShoppingCart } from "lucide-react";

// Dummy data for featured books
const featuredBooks = [
  {
    id: "1",
    title: "The Art of Modern Fiction",
    author: "Jane Smith",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    price: 24.99,
    rating: 4.8,
    reviews: 1243,
    genre: "Fiction",
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
  },
];

const stats = [
  { label: "Books Available", value: "10,000+", icon: BookOpen },
  { label: "Happy Readers", value: "50,000+", icon: Users },
  { label: "Average Rating", value: "4.8/5", icon: Star },
  { label: "Bestsellers", value: "500+", icon: TrendingUp },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Discover Your Next
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Great Read
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Explore thousands of books from renowned authors. Find your perfect story, 
              learn something new, or get lost in a world of imagination.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-base">
                <Link href="/books">
                  Browse Books <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link href="/authors">
                  Explore Authors
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                <div className="text-2xl font-bold md:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Featured Books
              </h2>
              <p className="mt-2 text-muted-foreground">
                Handpicked selections from our collection
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/books">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book) => (
              <Card key={book.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <Badge className="absolute right-2 top-2">{book.genre}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{book.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({book.reviews.toLocaleString()} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${book.price}</span>
                    <Button size="sm" variant="outline">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-2xl border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl">
                Start Your Reading Journey Today
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                Join thousands of readers discovering new stories every day
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/books">Explore Books</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/authors">Meet Authors</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

