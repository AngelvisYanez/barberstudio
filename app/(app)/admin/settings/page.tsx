import { getBusinessSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings-form";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <>
      <SiteHeader title="Configuración" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
