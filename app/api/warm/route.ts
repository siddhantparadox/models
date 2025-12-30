import { NextResponse } from "next/server"

import { getCatalog } from "@/lib/catalog"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.WARM_SECRET

  if (secret) {
    const provided = searchParams.get("secret")
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  await getCatalog()

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
