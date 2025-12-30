import "server-only"

import type { CatalogIndex, CatalogMeta, ModelDetail, ModelSummary } from "@/lib/catalog/types"
import { fetchCatalog } from "@/lib/catalog/fetchCatalog"
import { normalizeCatalog } from "@/lib/catalog/normalize"

const ONE_DAY_MS = 1000 * 60 * 60 * 24

let cachedCatalog: {
  data: CatalogIndex
  refreshedAt: number
} | null = null

export const getCatalog = async (): Promise<CatalogIndex> => {
  if (cachedCatalog && Date.now() - cachedCatalog.refreshedAt < ONE_DAY_MS) {
    return cachedCatalog.data
  }

  try {
    const raw = await fetchCatalog()
    const data = normalizeCatalog(raw)
    cachedCatalog = { data, refreshedAt: Date.now() }
    return data
  } catch (error) {
    if (cachedCatalog) return cachedCatalog.data
    throw error
  }
}

export const getCatalogMeta = async (): Promise<CatalogMeta> => {
  const catalog = await getCatalog()
  return {
    providers: catalog.providers,
    modalitiesIn: catalog.modalitiesIn,
    modalitiesOut: catalog.modalitiesOut,
  }
}

export const getModelSummary = async (
  id: string
): Promise<ModelSummary | null> => {
  const catalog = await getCatalog()
  return catalog.summaryById.get(id) ?? null
}

export const getModelDetail = async (
  id: string
): Promise<ModelDetail | null> => {
  const catalog = await getCatalog()
  return catalog.byId.get(id) ?? null
}

export type {
  CatalogIndex,
  CatalogMeta,
  ModelDetail,
  ModelSummary,
} from "@/lib/catalog/types"
