"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { CopyButton } from "@/components/common/copy-button"

export function CopyLinkButton() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [href, setHref] = React.useState("")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const query = searchParams.toString()
    const url = query ? `${pathname}?${query}` : pathname
    setHref(`${window.location.origin}${url}`)
  }, [pathname, searchParams])

  return (
    <CopyButton
      value={href}
      label="Copy link"
      copiedLabel="Link copied"
      disabled={!href}
    />
  )
}
