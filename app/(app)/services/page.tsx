import { getServices } from "@/actions/services";
import { ServiceForm } from "@/components/service-form";
import { ServicesTable } from "@/components/services-table";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <SiteHeader title="Servicios" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <ServiceForm />
        <ServicesTable services={services} />
      </div>
    </>
  );
}
