import { describe, expect, it } from "bun:test"

import { findAlternatives } from "./alternatives"
import type { ModelSummary } from "../catalog/types"

const buildSummary = (overrides: Partial<ModelSummary>): ModelSummary => ({
  id: "provider/model",
  name: "Model",
  providerId: "provider",
  providerName: "Provider",
  logoUrl: null,
  modalitiesIn: ["text"],
  modalitiesOut: ["text"],
  contextTokens: 100000,
  outputTokens: 2000,
  toolCall: true,
  structuredOutput: true,
  temperature: true,
  openWeights: false,
  reasoning: true,
  status: null,
  priceInPerMTokens: 2,
  priceOutPerMTokens: 2,
  releaseDate: "2024-01-01",
  lastUpdated: "2024-06-01",
  knowledgeCutoff: "2024-05-01",
  searchText: "provider model",
  ...overrides,
})

const buildRequest = (base: ModelSummary) => ({
  base,
  limit: 10,
})

describe("open weights alternatives scoring", () => {
  it("ranks stronger alternatives higher", () => {
    const base = buildSummary({ id: "base/model" })
    const best = buildSummary({
      id: "open/best",
      openWeights: true,
      contextTokens: 120000,
      outputTokens: 2200,
      priceInPerMTokens: 1,
      priceOutPerMTokens: 1,
      lastUpdated: "2024-10-01",
    })
    const worst = buildSummary({
      id: "open/worst",
      openWeights: true,
      contextTokens: 50000,
      outputTokens: 500,
      toolCall: false,
      structuredOutput: false,
      reasoning: false,
      temperature: false,
      priceInPerMTokens: 6,
      priceOutPerMTokens: 6,
      lastUpdated: "2021-01-01",
      status: "deprecated",
    })

    const items = findAlternatives([base, best, worst], buildRequest(base))

    expect(items[0]?.id).toBe(best.id)
    expect(items[1]?.id).toBe(worst.id)
  })

  it("penalizes deprecated models and surfaces the reason", () => {
    const base = buildSummary({ id: "base/model" })
    const normal = buildSummary({
      id: "open/normal",
      openWeights: true,
      contextTokens: 110000,
      outputTokens: 2200,
      priceInPerMTokens: 1,
      priceOutPerMTokens: 1,
      lastUpdated: "2024-10-01",
      status: null,
    })
    const deprecated = buildSummary({
      id: "open/deprecated",
      openWeights: true,
      contextTokens: 110000,
      outputTokens: 2200,
      priceInPerMTokens: 1,
      priceOutPerMTokens: 1,
      lastUpdated: "2024-10-01",
      status: "deprecated",
    })

    const items = findAlternatives(
      [base, normal, deprecated],
      buildRequest(base)
    )
    const normalItem = items.find((item) => item.id === normal.id)
    const deprecatedItem = items.find((item) => item.id === deprecated.id)

    expect(normalItem).toBeTruthy()
    expect(deprecatedItem).toBeTruthy()
    expect((normalItem?.score ?? 0) - (deprecatedItem?.score ?? 0)).toBeGreaterThanOrEqual(15)
    expect(deprecatedItem?.reasons).toContain("Deprecated")
  })

  it("returns nearest open weights even with modality gaps", () => {
    const base = buildSummary({
      id: "base/model",
      modalitiesIn: ["text", "image"],
      modalitiesOut: ["text"],
    })
    const candidate = buildSummary({
      id: "open/text-only",
      openWeights: true,
      modalitiesIn: ["text"],
      modalitiesOut: ["text"],
    })

    const items = findAlternatives([base, candidate], buildRequest(base))

    expect(items[0]?.id).toBe(candidate.id)
    expect(items[0]?.reasons.some((reason) => reason.includes("modalities"))).toBe(
      true
    )
  })
})
