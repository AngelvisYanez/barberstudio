import { getProducts } from "@/actions/products";
import { ProductForm } from "@/components/product-form";
import { ProductsTable } from "@/components/products-table";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, session] = await Promise.all([getProducts(), getSession()]);

  return (
    <>
      <SiteHeader title="Productos" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <ProductForm />
        <ProductsTable
          products={products}
          canEdit={session?.role === "ADMIN"}
        />
      </div>
    </>
  );
}
