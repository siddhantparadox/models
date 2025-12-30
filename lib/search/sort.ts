import type { ModelSummary } from "@/lib/catalog"
import { scoreSummary } from "@/lib/search/score"

export const SORT_OPTIONS = [
  "release",
  "updated",
  "context",
  "output",
  "cheapest",
  "best",
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const isSortOption = (value: string | null): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption)

const parseDate = (value: string | null) => {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const estimatePrice = (summary: ModelSummary) => {
  const input = summary.priceInPerMTokens
  const output = summary.priceOutPerMTokens
  if (input === null && output === null) return Number.POSITIVE_INFINITY
  return (input ?? 0) + (output ?? 0)
}

export const sortSummaries = (
  items: ModelSummary[],
  sort: SortOption,
  query: string,
  minContext: number | null,
  minOutput: number | null
) => {
  const sorted = [...items]

  switch (sort) {
    case "release":
      sorted.sort((a, b) => {
        const aDate = parseDate(a.releaseDate)
        const bDate = parseDate(b.releaseDate)
        return bDate - aDate
      })
      return sorted
    case "updated":
      sorted.sort((a, b) => {
        const aDate = parseDate(a.lastUpdated) || parseDate(a.releaseDate)
        const bDate = parseDate(b.lastUpdated) || parseDate(b.releaseDate)
        return bDate - aDate
      })
      return sorted
    case "cheapest":
      sorted.sort((a, b) => estimatePrice(a) - estimatePrice(b))
      return sorted
    case "context":
      sorted.sort(
        (a, b) => (b.contextTokens ?? 0) - (a.contextTokens ?? 0)
      )
      return sorted
    case "output":
      sorted.sort((a, b) => (b.outputTokens ?? 0) - (a.outputTokens ?? 0))
      return sorted
    case "best":
    default:
      sorted.sort((a, b) =>
        scoreSummary(b, query, minContext, minOutput) -
        scoreSummary(a, query, minContext, minOutput)
      )
      return sorted
  }
}
