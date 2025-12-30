import type { ModelSummary } from "@/lib/catalog"

export type AlternativesRequest = {
  base: ModelSummary
  requiredModalitiesIn: string[]
  requiredModalitiesOut: string[]
  minContext: number | null
  minOutput: number | null
  requireToolCall: boolean
  requireStructuredOutput: boolean
  limit: number
}

export type AlternativesItem = {
  id: string
  score: number
  reasons: string[]
  summary: ModelSummary
}

const includesAll = (haystack: string[], needles: string[]) => {
  if (!needles.length) return true
  const set = new Set(haystack.map((item) => item.toLowerCase()))
  return needles.every((needle) => set.has(needle.toLowerCase()))
}

const estimatePrice = (summary: ModelSummary) => {
  const input = summary.priceInPerMTokens
  const output = summary.priceOutPerMTokens
  if (input === null && output === null) return null
  return (input ?? 0) + (output ?? 0)
}

const scoreAlternative = (base: ModelSummary, candidate: ModelSummary) => {
  const baseContext = base.contextTokens
  const baseOutput = base.outputTokens
  const basePrice = estimatePrice(base)
  const candidatePrice = estimatePrice(candidate)

  const contextScore = baseContext
    ? Math.min(1, (candidate.contextTokens ?? 0) / baseContext)
    : 0.5
  const outputScore = baseOutput
    ? Math.min(1, (candidate.outputTokens ?? 0) / baseOutput)
    : 0.5

  let score = contextScore * 50 + outputScore * 30

  if (candidate.openWeights) score += 8
  if (candidate.toolCall) score += 4
  if (candidate.structuredOutput) score += 4

  if (basePrice !== null && candidatePrice !== null) {
    if (candidatePrice <= basePrice) score += 8
  }

  if (candidate.status?.toLowerCase() === "deprecated") score -= 15

  return Math.round(Math.max(0, Math.min(100, score)))
}

const buildReasons = (base: ModelSummary, candidate: ModelSummary) => {
  const reasons: string[] = []

  if (includesAll(candidate.modalitiesIn, base.modalitiesIn)) {
    reasons.push("Matches modalities")
  }

  if (base.contextTokens && candidate.contextTokens) {
    if (candidate.contextTokens >= base.contextTokens * 0.9) {
      reasons.push("Similar context window")
    }
  }

  if (base.toolCall && candidate.toolCall) {
    reasons.push("Supports tool calling")
  }

  if (base.structuredOutput && candidate.structuredOutput) {
    reasons.push("Supports structured output")
  }

  const basePrice = estimatePrice(base)
  const candidatePrice = estimatePrice(candidate)
  if (basePrice !== null && candidatePrice !== null) {
    if (candidatePrice < basePrice) reasons.push("Lower price")
  }

  if (candidate.openWeights) reasons.push("Open weights")

  return reasons.slice(0, 4)
}

export const findAlternatives = (
  summaries: ModelSummary[],
  request: AlternativesRequest
): AlternativesItem[] => {
  const { base, limit } = request

  const filtered = summaries.filter((summary) => {
    if (summary.id === base.id) return false
    if (summary.openWeights !== true) return false

    if (request.requireToolCall && summary.toolCall !== true) return false
    if (request.requireStructuredOutput && summary.structuredOutput !== true)
      return false

    if (!includesAll(summary.modalitiesIn, request.requiredModalitiesIn))
      return false
    if (!includesAll(summary.modalitiesOut, request.requiredModalitiesOut))
      return false

    if (request.minContext !== null) {
      if (summary.contextTokens === null) return false
      if (summary.contextTokens < request.minContext) return false
    }

    if (request.minOutput !== null) {
      if (summary.outputTokens === null) return false
      if (summary.outputTokens < request.minOutput) return false
    }

    return true
  })

  const ranked = filtered
    .map((summary) => ({
      id: summary.id,
      summary,
      score: scoreAlternative(base, summary),
      reasons: buildReasons(base, summary),
    }))
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, limit)
}
