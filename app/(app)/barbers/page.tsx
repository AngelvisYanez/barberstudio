import { getBarbers } from "@/actions/barbers";
import { BarberForm } from "@/components/barber-form";
import { BarbersTable } from "@/components/barbers-table";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function BarbersPage() {
  const barbers = await getBarbers();

  return (
    <>
      <SiteHeader title="Barberos" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <BarberForm />
        <BarbersTable barbers={barbers} />
      </div>
    </>
  );
}
