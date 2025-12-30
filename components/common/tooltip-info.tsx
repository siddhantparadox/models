"use client"

import * as React from "react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

type TooltipInfoProps = {
  label: string
  description: React.ReactNode
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
          <div className="text-muted-foreground mt-1">{description}</div>
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
        <div className="text-muted-foreground mt-1">{description}</div>
      </TooltipContent>
    </Tooltip>
  )
}
