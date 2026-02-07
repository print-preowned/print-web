import { BusinessesTable } from "./businesses-table";

export default function BusinessesPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Businesses</h1>
      <BusinessesTable />
    </div>
  );
}

