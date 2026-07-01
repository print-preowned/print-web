"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { FormDrawer, useFormDrawer } from "@/components/form-drawer";
import { AdminAuthorForm } from "@/app/admin/(content)/authors/form";
import { useQueryClient } from "@tanstack/react-query";
import { readAuthors, Author } from "@/lib/api/author";
import { apiFetch } from "@/lib/api";
import { Plus, EllipsisVertical } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { BulkUpload } from "@/components/bulk-upload";
import { parseCSV } from "@/lib/utils/csv";
import { createAuthor } from "@/lib/api/author";
import usePagination from "@/lib/pagination/usePagination";

type AuthorCSVRow = {
  first_name: string;
  last_name: string;
  middle_name?: string;
  about: string;
  image?: string;
  status?: string;
};

// Dummy author records for business display
const dummyAuthors: Author[] = [
  {
    id: "dummy-1",
    first_name: "Jane",
    last_name: "Smith",
    middle_name: null,
    about: "Award-winning fiction author with over 20 published novels. Known for her compelling character development and intricate plotlines.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    followers: 125000,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dummy-2",
    first_name: "Michael",
    last_name: "Chen",
    middle_name: "David",
    about: "Business strategist and thought leader in digital transformation. Author of multiple bestsellers on technology and innovation.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    followers: 89000,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dummy-3",
    first_name: "Sarah",
    last_name: "Johnson",
    middle_name: null,
    about: "Celebrity chef and cookbook author known for innovative recipes and fusion cuisine. Has published 12 cookbooks.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    followers: 210000,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dummy-4",
    first_name: "David",
    last_name: "Williams",
    middle_name: null,
    about: "Master of mystery and suspense with bestselling thriller series. Known for unexpected plot twists and engaging narratives.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    followers: 350000,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dummy-5",
    first_name: "Emily",
    last_name: "Rodriguez",
    middle_name: "Maria",
    about: "Life coach and motivational speaker helping millions achieve success. Author of 6 self-help books.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    followers: 450000,
    status: "INACTIVE",
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function AdminAuthorsPage() {
  const queryClient = useQueryClient();
  const { drawer, openDrawer, closeDrawer } = useFormDrawer();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: authors,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Author>({
    queryKey: ["authors", debouncedSearch, statusFilter],
    getUrl: ({ page, size, search: s, status }) =>
      readAuthors({
        page,
        size,
        filter: {
          search: (s as string) || undefined,
          status: status !== "all" ? (status as string) : undefined,
        },
      }),
    initialPageSize: 10,
    params: { search: debouncedSearch, status: statusFilter },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter]);


  const columns: ColumnDef<Author & { id: string }>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.first_name} {row.original.middle_name} {row.original.last_name}
        </span>
      ),
    },
    {
      accessorKey: "about",
      header: "About",
      cell: ({ row }) => (
        <span className="max-w-md truncate block">{row.original.about}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8 justify-self-end"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() =>
                openDrawer({
                  title: "Edit Author",
                  description: "Update author details",
                  children: (
                    <AdminAuthorForm
                      author={row.original}
                      onSuccess={closeDrawer}
                    />
                  ),
                })
              }
            >
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="space-y-4 mb-6">
        <div className="flex gap-8 justify-between">
          <div className="flex gap-4">
            <SearchInput
              wrapperClassName="flex-1"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() =>
                openDrawer({
                  title: "Create Author",
                  description: "Add a new author",
                  children: <AdminAuthorForm onSuccess={closeDrawer} />,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Author
            </Button>
            <BulkUpload<AuthorCSVRow>
              title="Bulk Upload Authors"
              description="Upload multiple authors from a CSV file. Each row should contain: first_name, last_name, middle_name (optional), about, image (optional), and optional status."
              sampleHeaders={["first_name", "last_name", "middle_name", "about", "image", "status"]}
              sampleRow={["Jane", "Smith", "", "Award-winning fiction author", "https://example.com/image.jpg", "ACTIVE"]}
              parseCSV={(csvText) => {
                const rows = parseCSV(csvText);
                if (rows.length < 2) throw new Error("CSV must have header row and at least one data row");
                const headers = rows[0].map(h => h.trim().toLowerCase());
                return rows.slice(1).map(row => {
                  const obj: any = {};
                  headers.forEach((header, idx) => {
                    obj[header] = row[idx]?.trim() || "";
                  });
                  return obj as AuthorCSVRow;
                });
              }}
              validateItem={(item, index) => {
                if (!item.first_name?.trim()) {
                  return { valid: false, error: "First name is required" };
                }
                if (!item.last_name?.trim()) {
                  return { valid: false, error: "Last name is required" };
                }
                if (!item.about?.trim()) {
                  return { valid: false, error: "About is required" };
                }
                return { valid: true };
              }}
              onUpload={async (items) => {
                let success = 0;
                let failed = 0;
                const errors: string[] = [];
                
                for (let i = 0; i < items.length; i++) {
                  try {
                    const item = items[i];
                    const request = await createAuthor({
                      first_name: item.first_name,
                      last_name: item.last_name,
                      middle_name: item.middle_name || null,
                      about: item.about,
                      image: item.image || "",
                      status: item.status || "ACTIVE",
                    });
                    
                    await apiFetch(request.endpoint, {
                      method: request.method as "POST",
                      body: request.body,
                    });
                    
                    success++;
                  } catch (error) {
                    failed++;
                    errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
                  }
                }
                
                if (success > 0) {
                  queryClient.invalidateQueries({ queryKey: ["authors"] });
                }
                
                return { success, failed, errors };
              }}
            />
          </div>
        </div>
      </div>

      {!authors.length && isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable
          data={authors.map((author) => ({ ...author, id: author.id }))}
          columns={columns}
          meta={{}}
          totalPages={totalPages}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      )}
      {drawer && <FormDrawer {...drawer} onClose={closeDrawer} />}
    </div>
  );
}
