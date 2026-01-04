import { Suspense } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { getCatalogMeta } from "@/lib/catalog"

export default async function Page() {
  const meta = await getCatalogMeta()
  return (
    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading...</div>}>
      <AppShell meta={meta} />
    </Suspense>
  )
}
