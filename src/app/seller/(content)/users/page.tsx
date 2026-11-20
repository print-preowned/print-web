"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { apiFetch, apiErrorToast } from "@/lib/api";
import { readRoles, type Role } from "@/lib/api/role";
import {
  changeMemberRole,
  createInvite,
  readInvites,
  readMembers,
  removeMember,
  resendInvite,
  revokeInvite,
  type SellerInvite,
  type SellerMember,
} from "@/lib/api/seller-team";
import { usePrivilege } from "@/lib/auth/context";
import type { BaseResponse } from "@/lib/model";
import type { PaginatedResponse } from "@/lib/api/user";

const TEAM_KEY = ["seller-team"] as const;

type Request = { endpoint: string; method: "POST" | "PATCH" | "DELETE"; body?: unknown };
const send = (request: Request) =>
  apiFetch(request.endpoint, { method: request.method, body: request.body });

function fullName(member: SellerMember) {
  return `${member.first_name} ${member.last_name}`.trim() || member.email;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Roles a member can be given: the store's own plus shared ones, never Owner. */
function useAssignableRoles() {
  const roles = useQuery<PaginatedResponse<Role>>({
    queryKey: ["roles", "assignable"],
    queryFn: () => apiFetch(readRoles({ page: 1, size: 100 })),
  });
  return (roles.data?.data ?? []).filter(
    (role) => !(role.seller_id === null && role.code === "OWNER"),
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const canInvite = usePrivilege("CREATE_SELLER_USER");
  const canChangeRole = usePrivilege("UPDATE_SELLER_USER");
  const canRemove = usePrivilege("DELETE_SELLER_USER");
  const [inviting, setInviting] = useState(false);
  const roles = useAssignableRoles();

  const members = useQuery<BaseResponse<SellerMember[]>>({
    queryKey: [...TEAM_KEY, "members"],
    queryFn: () => apiFetch(readMembers()),
  });
  const invites = useQuery<BaseResponse<SellerInvite[]>>({
    queryKey: [...TEAM_KEY, "invites"],
    queryFn: () => apiFetch(readInvites()),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: TEAM_KEY });

  const action = useMutation({
    mutationFn: async ({ request }: { request: Request; done: string }) => send(request),
    onSuccess: (_, { done }) => {
      toast.success(done);
      refresh();
    },
    onError: (error) => apiErrorToast(error, "That didn't work"),
  });

  const remove = async (member: SellerMember) => {
    const name = fullName(member);
    const ok = await confirm({
      title: `Remove ${name}?`,
      description: `${name} loses access to this store straight away. You can invite them again later.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) action.mutate({ request: removeMember(member.id), done: `${name} removed` });
  };

  const cancel = async (invite: SellerInvite) => {
    const ok = await confirm({
      title: `Cancel the invite to ${invite.email}?`,
      description: "The link in their email stops working.",
      confirmLabel: "Cancel invite",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (ok) action.mutate({ request: revokeInvite(invite.id), done: "Invite cancelled" });
  };

  const pending = invites.data?.data ?? [];

  return (
    <div className="container mx-auto space-y-6 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-muted-foreground max-w-xl text-sm">
          People who work in this store. Each person signs in with their own account, and
          their role decides what they can do.
        </p>
        {canInvite ? <Button onClick={() => setInviting(true)}>Invite someone</Button> : null}
      </div>

      <section className="space-y-2">
        <h2 className="text-md font-medium">Members</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                (members.data?.data ?? []).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{fullName(member)}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.is_owner || !canChangeRole ? (
                        member.role_name
                      ) : (
                        <Select
                          value={member.role_id}
                          onValueChange={(roleId) =>
                            action.mutate({
                              request: changeMemberRole(member.id, roleId),
                              done: `${fullName(member)}'s role changed`,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>{shortDate(member.created_at)}</TableCell>
                    <TableCell>
                      {canRemove && !member.is_owner ? (
                        <Button size="sm" variant="ghost" onClick={() => remove(member)}>
                          Remove
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {pending.length ? (
        <section className="space-y-2">
          <h2 className="text-md font-medium">Waiting to accept</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.role_name}</TableCell>
                    <TableCell>{invite.invited_by_name}</TableCell>
                    <TableCell>{shortDate(invite.expires_at)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {canInvite ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={action.isPending}
                          onClick={() =>
                            action.mutate({
                              request: resendInvite(invite.id),
                              done: `New link sent to ${invite.email}`,
                            })
                          }
                        >
                          Resend
                        </Button>
                      ) : null}
                      {canRemove ? (
                        <Button size="sm" variant="ghost" onClick={() => cancel(invite)}>
                          Cancel
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      <Dialog open={inviting} onOpenChange={setInviting}>
        {inviting ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite someone</DialogTitle>
              <DialogDescription>
                They get an email with a link to join. It works for 7 days.
              </DialogDescription>
            </DialogHeader>
            <InviteForm
              roles={roles}
              onSent={(email) => {
                setInviting(false);
                toast.success(`Invitation sent to ${email}`);
                refresh();
              }}
              onCancel={() => setInviting(false)}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function InviteForm({
  roles,
  onSent,
  onCancel,
}: {
  roles: Role[];
  onSent: (email: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  const invite = useMutation({
    mutationFn: () => send(createInvite({ email: email.trim(), role_id: roleId })),
    onSuccess: () => onSent(email.trim()),
    onError: (error) => apiErrorToast(error, "Could not send the invitation"),
  });

  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        invite.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger id="invite-role">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {roles.length === 0 ? (
          <p className="text-muted-foreground text-sm">No roles are available yet.</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            {roles.find((role) => role.id === roleId)?.description ??
              "The role decides what they can see and change."}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!email.trim() || !roleId || invite.isPending}>
          {invite.isPending ? "Sending…" : "Send invitation"}
        </Button>
      </DialogFooter>
    </form>
  );
}
