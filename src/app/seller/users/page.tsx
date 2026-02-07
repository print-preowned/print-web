"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  DataTable,
  DrawerContentType,
  TableCellViewer,
} from "@/components/data-table";
import z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleCheckBigIcon,
  EllipsisVertical,
  Loader,
  PlusCircleIcon,
} from "lucide-react";
// import { readUsers, createUser, updateUser, deleteUser, type User } from "@/lib/api/user";

type User = {
  id: string;
  role_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email: string;
  profile_image?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};
// import { StatusBadge } from "./components";

type FormState = Partial<
  Omit<User, "_id" | "created_at" | "updated_at" | "status">
> & {
  status?: string;
  password?: string;
};

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["/user/read"] });
  
  const [drawerContent, setDrawerContent] = useState<DrawerContentType | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      // Dummy data for now
      const dummy: User[] = [
        {
          id: "1",
          first_name: "Albert",
          last_name: "Dfi",
          email: "albert@example.com",
          status: "ACTIVE",
        },
        {
          id: "2",
          first_name: "Jane",
          last_name: "Cooper",
          email: "jane@example.com",
          status: "PENDING",
        },
        {
          id: "3",
          first_name: "Esther",
          last_name: "Howard",
          email: "esther@example.com",
          status: "ACTIVE",
        },
        {
          id: "4",
          first_name: "Jenny",
          last_name: "Wilson",
          email: "jenny@example.com",
          status: "CANCELLED",
        },
        {
          id: "5",
          first_name: "Robert",
          last_name: "Fox",
          email: "robert@example.com",
          status: "ACTIVE",
        },
      ];
      const filtered = search
        ? dummy.filter((d) =>
            `${d.first_name} ${d.last_name} ${d.email}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        : dummy;
      setData(filtered);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDrawerChange(contentType: DrawerContentType, contentData: any) {
    setDrawerContent(contentType);
    setDrawerData(contentData);
  }

  async function onDelete(id: string) {
    setData((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div>
      <DataTable
        data={data.map((d) => schema.parse({ ...d, role: "admin" }))}
        columns={columns}
        meta={{ 
          onDelete,
          onDrawerChange: handleDrawerChange,
        }}
      >
        <div className="flex mb-4">
          <Button 
            onClick={() => handleDrawerChange(DrawerContentType.UserForm, undefined)}
          >
            <PlusCircleIcon className="size-4" />
            Add User
          </Button>
        </div>
      </DataTable>
    </div>
  );
}

export const schema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone_number: z.string().optional(),
  country_code: z.string().optional(),
  role: z.string().optional(),
  status: z.string(),
});

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.first_name} {row.original.last_name}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.role}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span>{row.original.email}</span>,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "ACTIVE" ? (
          <CircleCheckBigIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <Loader />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
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
              table.options.meta?.onDrawerChange?.(
                DrawerContentType.UserForm,
                row.original
              )
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => table.options.meta?.onDelete?.(row.original.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
];
