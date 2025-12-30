"use client"

import * as React from "react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

type TooltipInfoProps = {
  label: string
  description: string
  variant?: "tooltip" | "hover"
}

export function TooltipInfo({
  label,
  description,
  variant = "tooltip",
}: TooltipInfoProps) {
  if (variant === "hover") {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <span
            aria-label={label}
            className="text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center"
          >
            <InfoIcon className="size-3.5" />
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="text-xs/relaxed">
          <div className="font-medium">{label}</div>
          <p className="text-muted-foreground mt-1">{description}</p>
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className="text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center"
        >
          <InfoIcon className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs/relaxed max-w-[220px]">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground mt-1 block">{description}</span>
      </TooltipContent>
    </Tooltip>
  )
}
