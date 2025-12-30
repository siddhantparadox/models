import type { SortOption } from "@/lib/search"

export type UrlState = {
  q: string
  sort: SortOption
  page: number
  pageSize: number
  selected: string | null
  providers: string[]
  modalitiesIn: string[]
  modalitiesOut: string[]
  toolCall: boolean
  structuredOutput: boolean
  openWeights: boolean
  minContext: number | null
  minOutput: number | null
  maxPriceIn: number | null
  maxPriceOut: number | null
  hideDeprecated: boolean
}

const DEFAULT_PAGE_SIZE = 25
const DEFAULT_SORT: SortOption = "best"

const parseNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseBoolean = (value: string | null) => value === "true"

const parseList = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []

export const parseUrlState = (params: URLSearchParams): UrlState => {
  const page = Math.max(1, parseNumber(params.get("page")) ?? 1)
  const pageSize = Math.min(
    50,
    Math.max(1, parseNumber(params.get("pageSize")) ?? DEFAULT_PAGE_SIZE)
  )
  const sortParam = params.get("sort")
  const sort = ([
    "best",
    "cheapest",
    "context",
    "updated",
  ] as SortOption[]).includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : DEFAULT_SORT

  return {
    q: params.get("q") ?? "",
    sort,
    page,
    pageSize,
    selected: params.get("selected"),
    providers: parseList(params.get("providers")),
    modalitiesIn: parseList(params.get("modalitiesIn")),
    modalitiesOut: parseList(params.get("modalitiesOut")),
    toolCall: parseBoolean(params.get("toolCall")),
    structuredOutput: parseBoolean(params.get("structuredOutput")),
    openWeights: parseBoolean(params.get("openWeights")),
    minContext: parseNumber(params.get("minContext")),
    minOutput: parseNumber(params.get("minOutput")),
    maxPriceIn: parseNumber(params.get("maxPriceIn")),
    maxPriceOut: parseNumber(params.get("maxPriceOut")),
    hideDeprecated: parseBoolean(params.get("hideDeprecated")),
  }
}

const setValue = (
  params: URLSearchParams,
  key: string,
  value: string | number | null | boolean | string[] | undefined,
  options?: { omitIfEmpty?: boolean }
) => {
  if (value === undefined) return
  params.delete(key)

  if (value === null) return
  if (typeof value === "boolean") {
    if (value) params.set(key, "true")
    return
  }
  if (Array.isArray(value)) {
    if (value.length) params.set(key, value.join(","))
    return
  }
  if (value === "") return

  if (options?.omitIfEmpty && value === "") return
  params.set(key, String(value))
}

export const buildSearchParams = (
  base: URLSearchParams,
  patch: Partial<UrlState>
) => {
  const next = new URLSearchParams(base.toString())

  setValue(next, "q", patch.q)
  setValue(next, "sort", patch.sort)
  setValue(next, "page", patch.page)
  setValue(next, "pageSize", patch.pageSize)
  setValue(next, "selected", patch.selected)
  setValue(next, "providers", patch.providers)
  setValue(next, "modalitiesIn", patch.modalitiesIn)
  setValue(next, "modalitiesOut", patch.modalitiesOut)
  setValue(next, "toolCall", patch.toolCall)
  setValue(next, "structuredOutput", patch.structuredOutput)
  setValue(next, "openWeights", patch.openWeights)
  setValue(next, "minContext", patch.minContext)
  setValue(next, "minOutput", patch.minOutput)
  setValue(next, "maxPriceIn", patch.maxPriceIn)
  setValue(next, "maxPriceOut", patch.maxPriceOut)
  setValue(next, "hideDeprecated", patch.hideDeprecated)

  return next
}

export const resetPaging = (state: Partial<UrlState>) => ({
  ...state,
  page: 1,
})
