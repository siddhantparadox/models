import { NextResponse } from "next/server"

import { getCatalog } from "@/lib/catalog"
import { findAlternatives } from "@/lib/search/alternatives"

const CACHE_TTL_MS = 1000 * 60 * 30
const alternativesCache = new Map<
  string,
  { expiresAt: number; payload: unknown }
>()

const parseNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

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

  const limit = Math.min(
    10,
    Math.max(1, parseNumber(searchParams.get("limit")) ?? 10)
  )

  const items = findAlternatives(catalog.summaries, {
    base,
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
