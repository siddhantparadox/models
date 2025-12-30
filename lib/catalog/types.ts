export type RawCatalog = Record<string, RawProvider>

export type RawProvider = {
  id?: string
  name?: string
  doc?: string
  api?: string
  npm?: string
  env?: string[]
  models?: Record<string, RawModel>
  [key: string]: unknown
}

export type RawModel = {
  id?: string
  name?: string
  family?: string
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
  structured_output?: boolean
  temperature?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: {
    input?: string[]
    output?: string[]
  }
  open_weights?: boolean
  cost?: {
    input?: number
    output?: number
    cache_read?: number
    cache_write?: number
    reasoning?: number
    input_audio?: number
    output_audio?: number
  }
  limit?: {
    context?: number
    input?: number
    output?: number
  }
  status?: string
  deprecated?: boolean
  [key: string]: unknown
}

export type ProviderInfo = {
  id: string
  name: string | null
  logoUrl: string | null
  docUrl: string | null
  apiUrl: string | null
}

export type ModelSummary = {
  id: string
  name: string | null
  providerId: string
  providerName: string | null
  logoUrl: string | null
  modalitiesIn: string[]
  modalitiesOut: string[]
  contextTokens: number | null
  outputTokens: number | null
  toolCall: boolean | null
  structuredOutput: boolean | null
  temperature: boolean | null
  openWeights: boolean | null
  reasoning: boolean | null
  status: string | null
  priceInPerMTokens: number | null
  priceOutPerMTokens: number | null
  releaseDate: string | null
  lastUpdated: string | null
  knowledgeCutoff: string | null
  searchText: string
}

export type NormalizedModel = {
  id: string
  name: string | null
  provider: ProviderInfo
  family: string | null
  attachment: boolean | null
  reasoning: boolean | null
  toolCall: boolean | null
  structuredOutput: boolean | null
  temperature: boolean | null
  openWeights: boolean | null
  status: string | null
  modalities: {
    input: string[]
    output: string[]
  }
  limits: {
    context: number | null
    input: number | null
    output: number | null
  }
  cost: {
    input: number | null
    output: number | null
    cacheRead: number | null
    cacheWrite: number | null
    reasoning: number | null
    inputAudio: number | null
    outputAudio: number | null
  }
  dates: {
    release: string | null
    lastUpdated: string | null
    knowledgeCutoff: string | null
  }
  source: {
    docUrl: string | null
    apiUrl: string | null
  }
}

export type ModelDetail = {
  id: string
  normalized: NormalizedModel
  raw: RawModel
}

export type CatalogIndex = {
  byId: Map<string, ModelDetail>
  summaryById: Map<string, ModelSummary>
  summaries: ModelSummary[]
  providers: ProviderInfo[]
  modalitiesIn: string[]
  modalitiesOut: string[]
}

export type CatalogMeta = Pick<
  CatalogIndex,
  "providers" | "modalitiesIn" | "modalitiesOut"
>
