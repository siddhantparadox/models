"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How to use the explorer</DialogTitle>
          <DialogDescription>
            A short flow to find the right model quickly.
          </DialogDescription>
        </DialogHeader>
        <ol className="text-xs/relaxed space-y-3">
          <li>
            <span className="font-medium">Set requirements</span>
            <div className="text-muted-foreground">
              Use presets and filters to lock in tool calling, modalities, and
              limits.
            </div>
          </li>
          <li>
            <span className="font-medium">Pick a model</span>
            <div className="text-muted-foreground">
              Scan results in the center panel and click to open details.
            </div>
          </li>
          <li>
            <span className="font-medium">Review details</span>
            <div className="text-muted-foreground">
              Check cost estimates, open-weights alternatives, and export links.
            </div>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  )
}
