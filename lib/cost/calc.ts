export type CostRates = {
  input: number | null
  output: number | null
  reasoning?: number | null
  cacheRead?: number | null
  cacheWrite?: number | null
  inputAudio?: number | null
  outputAudio?: number | null
}

export type CostInputs = {
  inputTokens: number
  outputTokens: number
  callsPerDay: number
  callsPerMonth: number
  reasoningTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  inputAudioTokens?: number
  outputAudioTokens?: number
}

export type CostBreakdownItem = {
  label: string
  tokens: number
  pricePerMTokens: number | null
  costPerCall: number | null
}

export type CostEstimate = {
  perCall: number | null
  perDay: number | null
  perMonth: number | null
  breakdown: CostBreakdownItem[]
  missingRates: string[]
}

const ONE_MILLION = 1_000_000

const calcBucket = (
  label: string,
  tokens: number,
  pricePerMTokens: number | null,
  missingRates: string[]
): CostBreakdownItem => {
  if (tokens <= 0) {
    return { label, tokens, pricePerMTokens, costPerCall: 0 }
  }

  if (pricePerMTokens === null) {
    missingRates.push(label)
    return { label, tokens, pricePerMTokens, costPerCall: null }
  }

  return {
    label,
    tokens,
    pricePerMTokens,
    costPerCall: (tokens / ONE_MILLION) * pricePerMTokens,
  }
}

export const estimateCost = (rates: CostRates, inputs: CostInputs): CostEstimate => {
  const missingRates: string[] = []

  const breakdown: CostBreakdownItem[] = [
    calcBucket("Input tokens", inputs.inputTokens, rates.input, missingRates),
    calcBucket(
      "Output tokens",
      inputs.outputTokens,
      rates.output,
      missingRates
    ),
    calcBucket(
      "Reasoning tokens",
      inputs.reasoningTokens ?? 0,
      rates.reasoning ?? null,
      missingRates
    ),
    calcBucket(
      "Cache read tokens",
      inputs.cacheReadTokens ?? 0,
      rates.cacheRead ?? null,
      missingRates
    ),
    calcBucket(
      "Cache write tokens",
      inputs.cacheWriteTokens ?? 0,
      rates.cacheWrite ?? null,
      missingRates
    ),
    calcBucket(
      "Input audio tokens",
      inputs.inputAudioTokens ?? 0,
      rates.inputAudio ?? null,
      missingRates
    ),
    calcBucket(
      "Output audio tokens",
      inputs.outputAudioTokens ?? 0,
      rates.outputAudio ?? null,
      missingRates
    ),
  ]

  const knownTotals = breakdown
    .map((item) => item.costPerCall)
    .filter((value): value is number => value !== null)

  const perCall = knownTotals.length
    ? knownTotals.reduce((sum, value) => sum + value, 0)
    : null

  const perDay = perCall !== null ? perCall * inputs.callsPerDay : null
  const perMonth = perCall !== null ? perCall * inputs.callsPerMonth : null

  return {
    perCall,
    perDay,
    perMonth,
    breakdown,
    missingRates,
  }
}
