import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-(--header-height) w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hidden size-11 md:inline-flex" />
        <Separator
          orientation="vertical"
          className="mx-2 hidden h-4 data-vertical:self-auto md:block"
        />
        <h1 className="min-w-0 truncate text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
