import type { ModelSummary } from "@/lib/catalog"

export type AlternativesRequest = {
  base: ModelSummary
  limit: number
}

export type AlternativesItem = {
  id: string
  score: number
  reasons: string[]
  summary: ModelSummary
}

const WEIGHTS = {
  modality: 20,
  context: 25,
  output: 15,
  capability: 20,
  price: 10,
  recency: 10,
} as const

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce(
  (sum, value) => sum + value,
  0
)
const WEIGHT_SCALE = 100 / TOTAL_WEIGHT
const DEPRECATED_PENALTY = 20

const CAPABILITY_FEATURES = [
  { key: "toolCall", label: "tool calling" },
  { key: "structuredOutput", label: "structured output" },
  { key: "reasoning", label: "reasoning" },
  { key: "temperature", label: "temperature control" },
] as const

type ReasonCandidate = {
  label: string
  impact: number
  polarity: "positive" | "negative"
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const hasPrice = (summary: ModelSummary) =>
  summary.priceInPerMTokens !== null || summary.priceOutPerMTokens !== null

const estimatePrice = (summary: ModelSummary) => {
  if (!hasPrice(summary)) return null
  return (summary.priceInPerMTokens ?? 0) + (summary.priceOutPerMTokens ?? 0)
}

type RatioInfo = {
  score: number
  ratio: number | null
  hasBase: boolean
  hasCandidate: boolean
}

type ModalityMatchInfo = {
  score: number
  status: "match" | "partial" | "none"
  hasBase: boolean
}

type ModalitiesInfo = {
  score: number
  input: ModalityMatchInfo
  output: ModalityMatchInfo
}

const normalizeModalities = (modalities: string[]) =>
  modalities.map((modality) => modality.toLowerCase())

const getModalityInfo = (
  baseModalities: string[],
  candidateModalities: string[]
): ModalityMatchInfo => {
  const base = normalizeModalities(baseModalities)
  const hasBase = base.length > 0
  if (!hasBase) {
    return { score: 1, status: "match", hasBase }
  }
  const candidate = new Set(normalizeModalities(candidateModalities))
  const missing = base.filter((item) => !candidate.has(item))
  const score = (base.length - missing.length) / base.length
  const status =
    missing.length === 0
      ? "match"
      : missing.length === base.length
        ? "none"
        : "partial"
  return { score, status, hasBase }
}

const getModalitiesInfo = (
  base: ModelSummary,
  candidate: ModelSummary
): ModalitiesInfo => {
  const input = getModalityInfo(base.modalitiesIn, candidate.modalitiesIn)
  const output = getModalityInfo(base.modalitiesOut, candidate.modalitiesOut)
  return {
    score: (input.score + output.score) / 2,
    input,
    output,
  }
}

const getRatioInfo = (
  baseValue: number | null,
  candidateValue: number | null
): RatioInfo => {
  const hasBase = baseValue !== null && baseValue > 0
  const hasCandidate = candidateValue !== null
  if (!hasBase || !hasCandidate) {
    return { score: 0.5, ratio: null, hasBase, hasCandidate }
  }
  const ratio = candidateValue / baseValue
  return {
    score: ratio >= 1 ? 1 : clamp(ratio, 0, 1),
    ratio,
    hasBase,
    hasCandidate,
  }
}

const getPriceInfo = (base: ModelSummary, candidate: ModelSummary) => {
  const baseHasPrice = hasPrice(base)
  const candidateHasPrice = hasPrice(candidate)

  if (!baseHasPrice && !candidateHasPrice) {
    return { score: 0.5, ratio: null, baseHasPrice, candidateHasPrice }
  }

  if (baseHasPrice && !candidateHasPrice) {
    return { score: 0.3, ratio: null, baseHasPrice, candidateHasPrice }
  }

  if (!baseHasPrice && candidateHasPrice) {
    return { score: 0.6, ratio: null, baseHasPrice, candidateHasPrice }
  }

  const basePrice = estimatePrice(base)
  const candidatePrice = estimatePrice(candidate)
  if (
    basePrice === null ||
    candidatePrice === null ||
    basePrice <= 0
  ) {
    return { score: 0.5, ratio: null, baseHasPrice, candidateHasPrice }
  }

  const ratio = candidatePrice / basePrice
  if (ratio <= 1) {
    return { score: 1, ratio, baseHasPrice, candidateHasPrice }
  }
  if (ratio >= 2) {
    return { score: 0, ratio, baseHasPrice, candidateHasPrice }
  }
  return { score: 1 - (ratio - 1), ratio, baseHasPrice, candidateHasPrice }
}

const parseDate = (value: string | null) => {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

const getSummaryDate = (summary: ModelSummary) =>
  parseDate(summary.lastUpdated ?? summary.releaseDate ?? summary.knowledgeCutoff)

const getRecencyInfo = (base: ModelSummary, candidate: ModelSummary) => {
  const baseDate = getSummaryDate(base)
  const candidateDate = getSummaryDate(candidate)

  if (!candidateDate) {
    return {
      score: 0.5,
      baseDate,
      candidateDate: null,
      isNewerThanBase: false,
      isRecent: false,
      isOlder: false,
    }
  }

  const now = Date.now()
  const yearMs = 1000 * 60 * 60 * 24 * 365
  const age = now - candidateDate
  const isNewerThanBase = baseDate !== null && candidateDate >= baseDate

  let score = 0.2
  if (isNewerThanBase || age <= yearMs) score = 1
  else if (age <= yearMs * 2) score = 0.6

  return {
    score,
    baseDate,
    candidateDate,
    isNewerThanBase,
    isRecent: score === 1,
    isOlder: score === 0.2,
  }
}

const scoreCapabilityFeature = (
  baseValue: boolean | null,
  candidateValue: boolean | null
) => {
  if (baseValue === true) return candidateValue === true ? 1 : 0
  return candidateValue === true ? 0.25 : 0
}

const weightedContribution = (score: number, weight: number) =>
  score * weight * WEIGHT_SCALE

const buildReasons = (
  base: ModelSummary,
  candidate: ModelSummary,
  modalitiesInfo: ModalitiesInfo,
  contextInfo: ReturnType<typeof getRatioInfo>,
  outputInfo: ReturnType<typeof getRatioInfo>,
  priceInfo: ReturnType<typeof getPriceInfo>,
  recencyInfo: ReturnType<typeof getRecencyInfo>,
  deprecated: boolean
) => {
  const candidates: ReasonCandidate[] = []
  const modalityWeight = WEIGHTS.modality / 2
  const modalityLabels = {
    input: {
      match: "Matches input modalities",
      partial: "Missing input modalities",
      none: "Input modalities differ",
    },
    output: {
      match: "Matches output modalities",
      partial: "Missing output modalities",
      none: "Output modalities differ",
    },
  }

  const addModalityReason = (
    info: ModalityMatchInfo,
    kind: "input" | "output"
  ) => {
    if (!info.hasBase) return
    const label = modalityLabels[kind][info.status]
    const impact =
      info.status === "match"
        ? weightedContribution(info.score, modalityWeight)
        : weightedContribution(1 - info.score, modalityWeight)
    candidates.push({
      label,
      impact,
      polarity: info.status === "match" ? "positive" : "negative",
    })
  }

  addModalityReason(modalitiesInfo.input, "input")
  addModalityReason(modalitiesInfo.output, "output")

  if (contextInfo.ratio !== null) {
    if (contextInfo.ratio >= 1) {
      candidates.push({
        label: "Context >= base",
        impact: weightedContribution(contextInfo.score, WEIGHTS.context),
        polarity: "positive",
      })
    } else if (contextInfo.ratio >= 0.9) {
      candidates.push({
        label: "Similar context",
        impact: weightedContribution(contextInfo.score, WEIGHTS.context),
        polarity: "positive",
      })
    } else {
      candidates.push({
        label: "Context smaller",
        impact: weightedContribution(1 - contextInfo.score, WEIGHTS.context),
        polarity: "negative",
      })
    }
  } else if (contextInfo.hasBase && !contextInfo.hasCandidate) {
    candidates.push({
      label: "Missing context info",
      impact: weightedContribution(1 - contextInfo.score, WEIGHTS.context),
      polarity: "negative",
    })
  }

  if (outputInfo.ratio !== null) {
    if (outputInfo.ratio >= 1) {
      candidates.push({
        label: "Output >= base",
        impact: weightedContribution(outputInfo.score, WEIGHTS.output),
        polarity: "positive",
      })
    } else if (outputInfo.ratio >= 0.9) {
      candidates.push({
        label: "Similar output",
        impact: weightedContribution(outputInfo.score, WEIGHTS.output),
        polarity: "positive",
      })
    } else {
      candidates.push({
        label: "Output smaller",
        impact: weightedContribution(1 - outputInfo.score, WEIGHTS.output),
        polarity: "negative",
      })
    }
  } else if (outputInfo.hasBase && !outputInfo.hasCandidate) {
    candidates.push({
      label: "Missing output info",
      impact: weightedContribution(1 - outputInfo.score, WEIGHTS.output),
      polarity: "negative",
    })
  }

  const perFeatureWeight =
    (WEIGHTS.capability / CAPABILITY_FEATURES.length) * WEIGHT_SCALE
  for (const feature of CAPABILITY_FEATURES) {
    const baseValue = base[feature.key]
    const candidateValue = candidate[feature.key]
    const featureScore = scoreCapabilityFeature(baseValue, candidateValue)

    if (baseValue === true) {
      if (candidateValue === true) {
        candidates.push({
          label: `Supports ${feature.label}`,
          impact: perFeatureWeight,
          polarity: "positive",
        })
      } else {
        candidates.push({
          label: `Missing ${feature.label}`,
          impact: perFeatureWeight,
          polarity: "negative",
        })
      }
    } else if (candidateValue === true) {
      candidates.push({
        label: `Adds ${feature.label}`,
        impact: perFeatureWeight * featureScore,
        polarity: "positive",
      })
    }
  }

  if (priceInfo.baseHasPrice && priceInfo.candidateHasPrice) {
    if (priceInfo.ratio !== null && priceInfo.ratio <= 1) {
      candidates.push({
        label: "Lower price",
        impact: weightedContribution(priceInfo.score, WEIGHTS.price),
        polarity: "positive",
      })
    } else {
      candidates.push({
        label: "Higher price",
        impact: weightedContribution(1 - priceInfo.score, WEIGHTS.price),
        polarity: "negative",
      })
    }
  } else if (priceInfo.baseHasPrice && !priceInfo.candidateHasPrice) {
    candidates.push({
      label: "Price unknown",
      impact: weightedContribution(1 - priceInfo.score, WEIGHTS.price),
      polarity: "negative",
    })
  } else if (!priceInfo.baseHasPrice && priceInfo.candidateHasPrice) {
    candidates.push({
      label: "Price available",
      impact: weightedContribution(priceInfo.score, WEIGHTS.price),
      polarity: "positive",
    })
  }

  if (recencyInfo.candidateDate) {
    if (recencyInfo.isNewerThanBase) {
      candidates.push({
        label: "Newer update",
        impact: weightedContribution(recencyInfo.score, WEIGHTS.recency),
        polarity: "positive",
      })
    } else if (recencyInfo.isRecent) {
      candidates.push({
        label: "Recent update",
        impact: weightedContribution(recencyInfo.score, WEIGHTS.recency),
        polarity: "positive",
      })
    } else if (recencyInfo.isOlder) {
      candidates.push({
        label: "Older update",
        impact: weightedContribution(1 - recencyInfo.score, WEIGHTS.recency),
        polarity: "negative",
      })
    }
  }

  if (deprecated) {
    candidates.push({
      label: "Deprecated",
      impact: DEPRECATED_PENALTY,
      polarity: "negative",
    })
  }

  const sorted = [...candidates].sort((a, b) => b.impact - a.impact)
  let selected = sorted.slice(0, 4)

  const hasNegative = selected.some(
    (candidate) => candidate.polarity === "negative"
  )
  if (!hasNegative) {
    const negativeCandidate = sorted.find(
      (candidate) =>
        candidate.polarity === "negative" && !selected.includes(candidate)
    )
    if (negativeCandidate) {
      if (selected.length >= 4) selected = selected.slice(0, 3)
      selected = [...selected, negativeCandidate]
    }
  }

  if (selected.length < 2 && candidates.length > selected.length) {
    selected = sorted.slice(0, Math.min(2, sorted.length))
  }

  return selected.map((candidate) => candidate.label)
}

const scoreAlternative = (
  base: ModelSummary,
  candidate: ModelSummary
): { score: number; reasons: string[] } => {
  const modalitiesInfo = getModalitiesInfo(base, candidate)
  const contextInfo = getRatioInfo(base.contextTokens, candidate.contextTokens)
  const outputInfo = getRatioInfo(base.outputTokens, candidate.outputTokens)
  const priceInfo = getPriceInfo(base, candidate)
  const recencyInfo = getRecencyInfo(base, candidate)

  const capabilityScores = CAPABILITY_FEATURES.map((feature) =>
    scoreCapabilityFeature(base[feature.key], candidate[feature.key])
  )
  const capabilityScore =
    capabilityScores.reduce((sum, value) => sum + value, 0) /
    CAPABILITY_FEATURES.length

  const deprecated = candidate.status?.toLowerCase() === "deprecated"

  let score =
    weightedContribution(modalitiesInfo.score, WEIGHTS.modality) +
    weightedContribution(contextInfo.score, WEIGHTS.context) +
    weightedContribution(outputInfo.score, WEIGHTS.output) +
    weightedContribution(capabilityScore, WEIGHTS.capability) +
    weightedContribution(priceInfo.score, WEIGHTS.price) +
    weightedContribution(recencyInfo.score, WEIGHTS.recency)

  if (deprecated) score -= DEPRECATED_PENALTY

  const finalScore = Math.round(clamp(score, 0, 100))

  return {
    score: finalScore,
    reasons: buildReasons(
      base,
      candidate,
      modalitiesInfo,
      contextInfo,
      outputInfo,
      priceInfo,
      recencyInfo,
      deprecated
    ),
  }
}

export const findAlternatives = (
  summaries: ModelSummary[],
  request: AlternativesRequest
): AlternativesItem[] => {
  const { base, limit } = request

  const filtered = summaries.filter((summary) => {
    if (summary.id === base.id) return false
    if (summary.openWeights !== true) return false

    return true
  })

  const ranked = filtered
    .map((summary) => ({
      id: summary.id,
      summary,
      ...scoreAlternative(base, summary),
    }))
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, limit)
}
