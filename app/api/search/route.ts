import { NextResponse } from "next/server"

import { getCatalog } from "@/lib/catalog"
import { isSortOption, searchSummaries, type SortOption } from "@/lib/search"

const parseList = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []

const parseNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseBoolean = (value: string | null) => value === "true"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseNumber(searchParams.get("page")) ?? 1)
  const pageSize = Math.min(
    50,
    Math.max(1, parseNumber(searchParams.get("pageSize")) ?? 25)
  )

  const sortParam = searchParams.get("sort")
  const sort: SortOption = isSortOption(sortParam) ? sortParam : "release"

  const filters = {
    query: searchParams.get("q")?.trim() ?? "",
    providers: parseList(searchParams.get("providers")),
    modalitiesIn: parseList(searchParams.get("modalitiesIn")),
    modalitiesOut: parseList(searchParams.get("modalitiesOut")),
    toolCall: parseBoolean(searchParams.get("toolCall")),
    structuredOutput: parseBoolean(searchParams.get("structuredOutput")),
    temperature: parseBoolean(searchParams.get("temperature")),
    openWeights: parseBoolean(searchParams.get("openWeights")),
    reasoning: parseBoolean(searchParams.get("reasoning")),
    minContext: parseNumber(searchParams.get("minContext")),
    minOutput: parseNumber(searchParams.get("minOutput")),
    maxPriceIn: parseNumber(searchParams.get("maxPriceIn")),
    maxPriceOut: parseNumber(searchParams.get("maxPriceOut")),
    hideDeprecated: parseBoolean(searchParams.get("hideDeprecated")),
  }

  const catalog = await getCatalog()

  const result = searchSummaries(catalog.summaries, {
    ...filters,
    page,
    pageSize,
    sort,
  })

  return NextResponse.json(
    {
      page,
      pageSize,
      total: result.total,
      items: result.items,
      usedStrict: result.usedStrict,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    }
  )
}
