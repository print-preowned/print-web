import { CreateBusinessSection } from "./create-business-section";

export default function AccountPage() {
  return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account</h1>
            <p className="text-muted-foreground">
              Manage your account settings and create a business
            </p>
          </div>

          <CreateBusinessSection />
        </div>
      </div>
  );
}
