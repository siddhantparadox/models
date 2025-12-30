"use client"

import * as React from "react"

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia(query)

    const updateMatch = () => setMatches(media.matches)
    updateMatch()

    if (media.addEventListener) {
      media.addEventListener("change", updateMatch)
      return () => media.removeEventListener("change", updateMatch)
    }

    media.addListener(updateMatch)
    return () => media.removeListener(updateMatch)
  }, [query])

  return matches
}
