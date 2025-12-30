import { NextResponse } from "next/server"

import { getCatalog } from "@/lib/catalog"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const catalog = await getCatalog()
  const summary = catalog.summaryById.get(id)
  const detail = catalog.byId.get(id)

  if (!summary || !detail) {
    return NextResponse.json(
      { error: `Model not found for id: ${id}` },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      summary,
      detail,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  )
}
