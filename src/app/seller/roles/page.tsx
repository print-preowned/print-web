"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { createRole, deleteRole, readRoles, updateRole, type Role } from "@/lib/api/role";
import { PaginatedResponse } from "@/lib/api/user";

type RoleForm = Partial<Pick<Role, "name" | "description">>;

export default function RolesPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>({});

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<Role>>(readRoles({ page: 1, size: 50, filter: { search } }));
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setEditing(null);
    setForm({});
    setOpen(true);
  }

  function startEdit(role: Role) {
    setEditing(role);
    setForm({ name: role.name, description: role.description ?? undefined });
    setOpen(true);
  }

  async function save() {
    if (editing) {
      const req = updateRole(editing.id, { name: form.name, description: form.description });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    } else {
      const req = createRole({ name: form.name || "", description: form.description });
      await apiFetch(req.endpoint, { method: req.method, body: req.body });
    }
    setOpen(false);
    await load();
  }

  async function onDelete(id: string) {
    const req = deleteRole(id);
    await apiFetch(req.endpoint, { method: req.method });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={load} disabled={loading}>Search</Button>
        </div>
        <Button onClick={startCreate}>New Role</Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.description}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
