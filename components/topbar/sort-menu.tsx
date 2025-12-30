"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SORT_OPTIONS, type SortOption } from "@/lib/search/sort"

const SORT_LABELS: Record<SortOption, string> = {
  release: "Release date (newest)",
  updated: "Last updated (newest)",
  context: "Largest context",
  output: "Largest output",
  cheapest: "Cheapest",
  best: "Best match",
}

type SortMenuProps = {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Sort: {SORT_LABELS[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as SortOption)}
        >
          {SORT_OPTIONS.map((key) => (
            <DropdownMenuRadioItem key={key} value={key}>
              {SORT_LABELS[key]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
