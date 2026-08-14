import {
  getInventoryOverview,
  getRecentMovements,
} from "@/actions/inventory";
import { InventoryForm } from "@/components/inventory-form";
import { InventoryTable } from "@/components/inventory-table";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [overview, movements] = await Promise.all([
    getInventoryOverview(),
    getRecentMovements(),
  ]);

  return (
    <>
      <SiteHeader title="Inventario" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <InventoryForm products={overview} />
        <InventoryTable overview={overview} movements={movements} />
      </div>
    </>
  );
}
