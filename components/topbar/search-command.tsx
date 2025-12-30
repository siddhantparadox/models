"use client"

import * as React from "react"

import type { ModelSummary } from "@/lib/catalog/types"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

const MAX_SUGGESTIONS = 10

type SearchCommandProps = {
  value: string
  onValueChange: (value: string) => void
  suggestions: ModelSummary[]
  onSelect: (id: string) => void
  isLoading?: boolean
}

export function SearchCommand({
  value,
  onValueChange,
  suggestions,
  onSelect,
  isLoading = false,
}: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)

  const items = suggestions.slice(0, MAX_SUGGESTIONS)

  return (
    <div className="relative w-full">
      <Command shouldFilter={false} className="bg-transparent">
        <CommandInput
          value={value}
          onValueChange={(nextValue) => {
            onValueChange(nextValue)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150)
          }}
          placeholder="Search models, providers, or capabilities"
          className="bg-background"
        />
        {open && (value.trim().length > 0 || items.length > 0) && (
          <div className="bg-popover border-border absolute left-0 right-0 top-full z-20 mt-2 border shadow-md">
            <CommandList>
              {items.length === 0 && !isLoading && (
                <CommandEmpty>No matches found.</CommandEmpty>
              )}
              {isLoading && (
                <CommandEmpty>Searching catalog...</CommandEmpty>
              )}
              {items.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => {
                        onSelect(item.id)
                        setOpen(false)
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {item.name ?? item.id}
                          </div>
                          <div className="text-muted-foreground truncate text-[11px]">
                            {item.id}
                          </div>
                        </div>
                        {item.openWeights && (
                          <Badge variant="secondary">Open weights</Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
