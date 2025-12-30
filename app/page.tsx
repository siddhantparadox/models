import { AppShell } from "@/components/layout/app-shell"
import { getCatalogMeta } from "@/lib/catalog"

export default async function Page() {
  const meta = await getCatalogMeta()
  return <AppShell meta={meta} />
}
