import type { ModelSummary } from "@/lib/catalog"
import { filterSummaries, type SearchFilters } from "@/lib/search/filter"
import {
  sortSummaries,
  type SortOption,
  SORT_OPTIONS,
  isSortOption,
} from "@/lib/search/sort"

export type SearchRequest = SearchFilters & {
  page: number
  pageSize: number
  sort: SortOption
}

export type SearchResult = {
  items: ModelSummary[]
  total: number
  usedStrict: boolean
}

export const searchSummaries = (
  summaries: ModelSummary[],
  request: SearchRequest
): SearchResult => {
  const strictFiltered = filterSummaries(
    summaries,
    request,
    true
  )
  let filtered = strictFiltered
  let usedStrict = true

  if (request.query && strictFiltered.length === 0) {
    filtered = filterSummaries(summaries, request, false)
    usedStrict = false
  }

  const sorted = sortSummaries(
    filtered,
    request.sort,
    request.query,
    request.minContext,
    request.minOutput
  )

  const total = sorted.length
  const start = (request.page - 1) * request.pageSize
  const end = start + request.pageSize

  return {
    items: sorted.slice(start, end),
    total,
    usedStrict,
  }
}

export type { SearchFilters } from "@/lib/search/filter"
export type { SortOption } from "@/lib/search/sort"
export { SORT_OPTIONS, isSortOption }
