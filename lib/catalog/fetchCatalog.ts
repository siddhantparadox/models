import type { RawCatalog } from "@/lib/catalog/types"

const CATALOG_URL = "https://models.dev/api.json"
const ONE_DAY_SECONDS = 60 * 60 * 24

export const fetchCatalog = async (): Promise<RawCatalog> => {
  const response = await fetch(CATALOG_URL, {
    next: { revalidate: ONE_DAY_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog (${response.status})`)
  }

  return (await response.json()) as RawCatalog
}
