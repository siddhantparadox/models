import type { ModelSummary } from "@/lib/catalog"

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const closenessScore = (value: number | null, target: number | null) => {
  if (value === null || target === null) return 0
  if (target <= 0) return 0
  const delta = Math.abs(value - target)
  return clamp(1 - delta / target, 0, 1)
}

export const scoreSummary = (
  summary: ModelSummary,
  query: string,
  minContext: number | null,
  minOutput: number | null
) => {
  let score = 0
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery) {
    if (summary.id.toLowerCase() === normalizedQuery) score += 100
    else if (summary.id.toLowerCase().includes(normalizedQuery)) score += 60

    if (summary.name?.toLowerCase().includes(normalizedQuery)) score += 40

    const tokens = tokenize(normalizedQuery)
    for (const token of tokens) {
      if (summary.searchText.includes(token)) score += 8
    }
  }

  score += closenessScore(summary.contextTokens, minContext) * 10
  score += closenessScore(summary.outputTokens, minOutput) * 6

  if (summary.openWeights) score += 2
  if (summary.toolCall) score += 1
  if (summary.status?.toLowerCase() === "deprecated") score -= 10

  return score
}
