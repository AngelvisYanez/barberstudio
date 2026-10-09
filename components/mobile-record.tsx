import type { ReactNode } from "react";

export function MobileRecordList({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:hidden">{children}</div>;
}

export function MobileRecord({
  title,
  meta,
  aside,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          {meta ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {meta}
            </p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0 text-right">{aside}</div> : null}
      </div>
      {actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 [&_button]:h-11 [&_button]:min-w-11">
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export const desktopTableClass = "hidden overflow-x-auto rounded-lg border md:block";
