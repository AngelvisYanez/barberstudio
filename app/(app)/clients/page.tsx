import { getClients } from "@/actions/clients";
import { ClientForm } from "@/components/client-form";
import { ClientsTable } from "@/components/clients-table";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <>
      <SiteHeader title="Clientes" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <ClientForm />
        <ClientsTable clients={clients} />
      </div>
    </>
  );
}
