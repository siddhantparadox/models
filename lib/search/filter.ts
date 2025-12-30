import type { ModelSummary } from "@/lib/catalog"

export type SearchFilters = {
  query: string
  providers: string[]
  modalitiesIn: string[]
  modalitiesOut: string[]
  toolCall: boolean
  structuredOutput: boolean
  temperature: boolean
  openWeights: boolean
  reasoning: boolean
  minContext: number | null
  minOutput: number | null
  maxPriceIn: number | null
  maxPriceOut: number | null
  hideDeprecated: boolean
}

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

const matchesQuery = (
  summary: ModelSummary,
  query: string,
  strict: boolean
) => {
  if (!query) return true

  const lowerQuery = query.toLowerCase()
  const idLike = /[/:]/.test(lowerQuery)
  if (idLike) {
    return summary.id.toLowerCase().includes(lowerQuery)
  }

  const tokens = tokenize(lowerQuery)
  if (!tokens.length) return true

  if (strict) {
    return tokens.every((token) => summary.searchText.includes(token))
  }

  return tokens.some((token) => summary.searchText.includes(token))
}

const includesAll = (haystack: string[], needles: string[]) => {
  if (!needles.length) return true
  const set = new Set(haystack.map((item) => item.toLowerCase()))
  return needles.every((needle) => set.has(needle.toLowerCase()))
}

export const filterSummaries = (
  summaries: ModelSummary[],
  filters: SearchFilters,
  strict: boolean
): ModelSummary[] => {
  return summaries.filter((summary) => {
    if (!matchesQuery(summary, filters.query, strict)) return false

    if (filters.providers.length) {
      if (!filters.providers.includes(summary.providerId)) return false
    }

    if (!includesAll(summary.modalitiesIn, filters.modalitiesIn)) return false
    if (!includesAll(summary.modalitiesOut, filters.modalitiesOut)) return false

    if (filters.toolCall && summary.toolCall !== true) return false
    if (filters.structuredOutput && summary.structuredOutput !== true) return false
    if (filters.temperature && summary.temperature !== true) return false
    if (filters.openWeights && summary.openWeights !== true) return false
    if (filters.reasoning && summary.reasoning !== true) return false

    if (filters.minContext !== null) {
      if (summary.contextTokens === null) return false
      if (summary.contextTokens < filters.minContext) return false
    }

    if (filters.minOutput !== null) {
      if (summary.outputTokens === null) return false
      if (summary.outputTokens < filters.minOutput) return false
    }

    if (filters.maxPriceIn !== null) {
      if (summary.priceInPerMTokens === null) return false
      if (summary.priceInPerMTokens > filters.maxPriceIn) return false
    }

    if (filters.maxPriceOut !== null) {
      if (summary.priceOutPerMTokens === null) return false
      if (summary.priceOutPerMTokens > filters.maxPriceOut) return false
    }

    if (filters.hideDeprecated) {
      if (summary.status?.toLowerCase() === "deprecated") return false
    }

    return true
  })
}
