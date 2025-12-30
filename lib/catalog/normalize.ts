import type {
  CatalogIndex,
  NormalizedModel,
  ProviderInfo,
  RawCatalog,
  RawModel,
  RawProvider,
} from "@/lib/catalog/types"

const LOGO_BASE_URL = "https://models.dev/logos"

const toString = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const toBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const items = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase())
  return Array.from(new Set(items))
}

const buildSearchText = (parts: Array<string | null | undefined>) =>
  parts
    .filter((part) => typeof part === "string")
    .map((part) => (part as string).toLowerCase())
    .join(" ")

const buildProviderInfo = (
  providerId: string,
  provider: RawProvider
): ProviderInfo => {
  const name = toString(provider.name) ?? providerId
  const logoUrl = providerId ? `${LOGO_BASE_URL}/${providerId}.svg` : null
  return {
    id: providerId,
    name,
    logoUrl,
    docUrl: toString(provider.doc),
    apiUrl: toString(provider.api),
  }
}

const normalizeModel = (
  providerInfo: ProviderInfo,
  providerId: string,
  modelKey: string,
  model: RawModel
) => {
  const modelId = toString(model.id) ?? modelKey
  const trimmedId = modelId.replace(/^\/+|\/+$/g, "")
  const fullId = trimmedId.startsWith(`${providerId}/`)
    ? trimmedId
    : `${providerId}/${trimmedId}`
  const name = toString(model.name) ?? modelId
  const modalitiesIn = normalizeStringArray(model.modalities?.input)
  const modalitiesOut = normalizeStringArray(model.modalities?.output)
  const status = toString(model.status) ?? (model.deprecated ? "deprecated" : null)

  const normalized: NormalizedModel = {
    id: fullId,
    name,
    provider: providerInfo,
    family: toString(model.family),
    attachment: toBoolean(model.attachment),
    reasoning: toBoolean(model.reasoning),
    toolCall: toBoolean(model.tool_call),
    structuredOutput: toBoolean(model.structured_output),
    temperature: toBoolean(model.temperature),
    openWeights: toBoolean(model.open_weights),
    status,
    modalities: {
      input: modalitiesIn,
      output: modalitiesOut,
    },
    limits: {
      context: toNumber(model.limit?.context),
      input: toNumber(model.limit?.input),
      output: toNumber(model.limit?.output),
    },
    cost: {
      input: toNumber(model.cost?.input),
      output: toNumber(model.cost?.output),
      cacheRead: toNumber(model.cost?.cache_read),
      cacheWrite: toNumber(model.cost?.cache_write),
      reasoning: toNumber(model.cost?.reasoning),
      inputAudio: toNumber(model.cost?.input_audio),
      outputAudio: toNumber(model.cost?.output_audio),
    },
    dates: {
      release: toString(model.release_date),
      lastUpdated: toString(model.last_updated),
      knowledgeCutoff: toString(model.knowledge),
    },
    source: {
      docUrl: providerInfo.docUrl,
      apiUrl: providerInfo.apiUrl,
    },
  }

  return {
    fullId,
    normalized,
  }
}

export const normalizeCatalog = (raw: RawCatalog): CatalogIndex => {
  const byId = new Map<string, { id: string; normalized: NormalizedModel; raw: RawModel }>()
  const summaryById = new Map()
  const summaries = []
  const providers = []
  const modalitiesIn = new Set<string>()
  const modalitiesOut = new Set<string>()

  for (const [providerKey, providerValue] of Object.entries(raw ?? {})) {
    if (!providerValue || typeof providerValue !== "object") continue
    const provider = providerValue as RawProvider
    const providerId = toString(provider.id) ?? providerKey
    if (!providerId) continue
    const providerInfo = buildProviderInfo(providerId, provider)
    providers.push(providerInfo)

    const models = provider.models
    if (!models || typeof models !== "object") continue

    for (const [modelKey, modelValue] of Object.entries(models)) {
      if (!modelValue || typeof modelValue !== "object") continue
      const model = modelValue as RawModel
      const { fullId, normalized } = normalizeModel(
        providerInfo,
        providerId,
        modelKey,
        model
      )

      if (byId.has(fullId)) continue

      const summary = {
        id: fullId,
        name: normalized.name,
        providerId,
        providerName: providerInfo.name,
        logoUrl: providerInfo.logoUrl,
        modalitiesIn: normalized.modalities.input,
        modalitiesOut: normalized.modalities.output,
        contextTokens: normalized.limits.context,
        outputTokens: normalized.limits.output,
        toolCall: normalized.toolCall,
        structuredOutput: normalized.structuredOutput,
        temperature: normalized.temperature,
        openWeights: normalized.openWeights,
        reasoning: normalized.reasoning,
        status: normalized.status,
        priceInPerMTokens: normalized.cost.input,
        priceOutPerMTokens: normalized.cost.output,
        releaseDate: normalized.dates.release,
        lastUpdated: normalized.dates.lastUpdated,
        knowledgeCutoff: normalized.dates.knowledgeCutoff,
        searchText: buildSearchText([
          fullId,
          normalized.name,
          providerId,
          providerInfo.name,
          normalized.family,
          ...normalized.modalities.input,
          ...normalized.modalities.output,
        ]),
      }

      for (const modality of summary.modalitiesIn) modalitiesIn.add(modality)
      for (const modality of summary.modalitiesOut) modalitiesOut.add(modality)

      byId.set(fullId, { id: fullId, normalized, raw: model })
      summaryById.set(fullId, summary)
      summaries.push(summary)
    }
  }

  providers.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id))

  return {
    byId,
    summaryById,
    summaries,
    providers,
    modalitiesIn: Array.from(modalitiesIn).sort(),
    modalitiesOut: Array.from(modalitiesOut).sort(),
  }
}
