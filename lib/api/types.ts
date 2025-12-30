import type { ModelDetail, ModelSummary } from "@/lib/catalog/types"

export type SearchResponse = {
  page: number
  pageSize: number
  total: number
  items: ModelSummary[]
  usedStrict?: boolean
}

export type ModelResponse = {
  summary: ModelSummary
  detail: ModelDetail
}

export type AlternativesItem = {
  id: string
  score: number
  reasons: string[]
  summary: ModelSummary
}

export type AlternativesResponse = {
  baseId: string
  items: AlternativesItem[]
}
