import {
  getAppointmentOptions,
  getAppointments,
} from "@/actions/appointments";
import { AppointmentForm } from "@/components/appointment-form";
import { AppointmentsTable } from "@/components/appointments-table";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const [appointments, options] = await Promise.all([
    getAppointments(),
    getAppointmentOptions(),
  ]);

  return (
    <>
      <SiteHeader title="Citas" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <AppointmentForm options={options} />
        <AppointmentsTable appointments={appointments} />
      </div>
    </>
  );
}
