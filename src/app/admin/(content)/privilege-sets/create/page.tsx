import { AdminPrivilegeSetForm } from "../form";

export default function AdminCreatePrivilegeSetPage() {
  
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create privilege set</h1>
        <p className="text-muted-foreground text-sm">
          Define a platform role and choose the privileges it grants.
        </p>
      </div>
      <AdminPrivilegeSetForm />
    </div>
  );
}