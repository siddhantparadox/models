import type { ModelSummary } from "@/lib/catalog"
import { scoreSummary } from "@/lib/search/score"

export type SortOption = "best" | "cheapest" | "context" | "updated"

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
    case "cheapest":
      sorted.sort((a, b) => estimatePrice(a) - estimatePrice(b))
      return sorted
    case "context":
      sorted.sort(
        (a, b) => (b.contextTokens ?? 0) - (a.contextTokens ?? 0)
      )
      return sorted
    case "updated":
      sorted.sort((a, b) => {
        const aDate = parseDate(a.lastUpdated) || parseDate(a.releaseDate)
        const bDate = parseDate(b.lastUpdated) || parseDate(b.releaseDate)
        return bDate - aDate
      })
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
