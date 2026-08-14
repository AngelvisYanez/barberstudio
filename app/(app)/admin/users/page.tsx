import { getUsers } from "@/actions/users";
import { SiteHeader } from "@/components/site-header";
import { UsersAdmin } from "@/components/users-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <>
      <SiteHeader title="Usuarios" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <UsersAdmin users={users} />
      </div>
    </>
  );
}
