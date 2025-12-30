import { NextResponse } from "next/server"

import { getCatalog } from "@/lib/catalog"
import { findAlternatives } from "@/lib/search/alternatives"

const CACHE_TTL_MS = 1000 * 60 * 30
const alternativesCache = new Map<
  string,
  { expiresAt: number; payload: unknown }
>()

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
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const cacheKey = `${id}?${searchParams.toString()}`
  const cached = alternativesCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  }

  const catalog = await getCatalog()
  const base = catalog.summaryById.get(id)

  if (!base) {
    return NextResponse.json(
      { error: `Model not found for id: ${id}` },
      { status: 404 }
    )
  }

  const requiredModalitiesInParam = parseList(
    searchParams.get("requiredModalitiesIn")
  )
  const requiredModalitiesOutParam = parseList(
    searchParams.get("requiredModalitiesOut")
  )
  const requiredModalitiesIn = requiredModalitiesInParam.length
    ? requiredModalitiesInParam
    : base.modalitiesIn
  const requiredModalitiesOut = requiredModalitiesOutParam.length
    ? requiredModalitiesOutParam
    : base.modalitiesOut

  const minContext =
    parseNumber(searchParams.get("minContext")) ??
    (base.contextTokens ? Math.floor(base.contextTokens * 0.8) : null)
  const minOutput =
    parseNumber(searchParams.get("minOutput")) ??
    (base.outputTokens ? Math.floor(base.outputTokens * 0.8) : null)

  const requireToolCallParam = searchParams.get("requireToolCall")
  const requireStructuredOutputParam = searchParams.get(
    "requireStructuredOutput"
  )
  const requireToolCall =
    requireToolCallParam === null
      ? base.toolCall === true
      : parseBoolean(requireToolCallParam)
  const requireStructuredOutput =
    requireStructuredOutputParam === null
      ? base.structuredOutput === true
      : parseBoolean(requireStructuredOutputParam)

  const limit = Math.min(
    20,
    Math.max(1, parseNumber(searchParams.get("limit")) ?? 6)
  )

  const items = findAlternatives(catalog.summaries, {
    base,
    requiredModalitiesIn,
    requiredModalitiesOut,
    minContext,
    minOutput,
    requireToolCall,
    requireStructuredOutput,
    limit,
  })

  const payload = {
    baseId: base.id,
    items,
  }

  alternativesCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload,
  })

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  })
}
