"use client"

import * as React from "react"
import useSWR from "swr"
import { useRouter, useSearchParams } from "next/navigation"

import type { CatalogMeta } from "@/lib/catalog/types"
import type { ModelResponse, SearchResponse } from "@/lib/api/types"
import { apiFetcher } from "@/lib/api/fetcher"
import { buildSearchParams, parseUrlState, resetPaging } from "@/lib/url/state"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SearchCommand } from "@/components/topbar/search-command"
import { SortMenu } from "@/components/topbar/sort-menu"
import { HelpDialog } from "@/components/topbar/help-dialog"
import { CopyLinkButton } from "@/components/topbar/copy-link-button"
import { FiltersPanel } from "@/components/filters/filters-panel"
import { ResultsPanel } from "@/components/results/results-panel"
import { DetailsPanel } from "@/components/details/details-panel"

type AppShellProps = {
  meta: CatalogMeta
}

export function AppShell({ meta }: AppShellProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = React.useTransition()
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const state = React.useMemo(() => {
    return parseUrlState(new URLSearchParams(searchParams.toString()))
  }, [searchParams])

  const [queryInput, setQueryInput] = React.useState(state.q)
  const deferredQuery = React.useDeferredValue(queryInput)

  React.useEffect(() => {
    setQueryInput(state.q)
  }, [state.q])

  const updateState = React.useCallback(
    (
      patch: Partial<typeof state>,
      options?: { replace?: boolean; resetPage?: boolean }
    ) => {
      const base = new URLSearchParams(searchParams.toString())
      const patchWithPage = options?.resetPage ? resetPaging(patch) : patch
      const next = buildSearchParams(base, patchWithPage)
      const url = `?${next.toString()}`

      startTransition(() => {
        if (options?.replace) {
          router.replace(url, { scroll: false })
        } else {
          router.push(url, { scroll: false })
        }
      })
    },
    [router, searchParams, startTransition]
  )

  React.useEffect(() => {
    if (queryInput === state.q) return
    updateState({ q: queryInput, page: 1 }, { replace: true })
  }, [queryInput, state.q, updateState])

  const searchUrl = React.useMemo(() => {
    const params = buildSearchParams(new URLSearchParams(), {
      ...state,
      q: deferredQuery,
      selected: null,
    })
    return `/api/search?${params.toString()}`
  }, [state, deferredQuery])

  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
  } = useSWR<SearchResponse>(searchUrl, apiFetcher, { keepPreviousData: true })

  const selectedId = state.selected
  const detailUrl = selectedId
    ? `/api/model?id=${encodeURIComponent(selectedId)}`
    : null
  const {
    data: detailData,
    error: detailError,
    isLoading: detailLoading,
  } = useSWR<ModelResponse>(detailUrl, apiFetcher)

  const selectedSummary =
    detailData?.summary ??
    searchData?.items.find((item) => item.id === selectedId) ??
    null

  const handleSelect = (id: string) => {
    updateState({ selected: id }, { replace: false })
  }

  const handleClearSelection = () => {
    updateState({ selected: null }, { replace: true })
  }

  const handleFiltersOpenChange = (open: boolean) => {
    setFiltersOpen(open)
  }

  const handleDetailsOpenChange = (open: boolean) => {
    if (!open) {
      handleClearSelection()
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="min-w-[240px] flex-1">
              <SearchCommand
                value={queryInput}
                onValueChange={setQueryInput}
                suggestions={searchData?.items ?? []}
                onSelect={(id) => {
                  handleSelect(id)
                  setQueryInput(id)
                }}
                isLoading={searchLoading}
              />
            </div>
            <SortMenu
              value={state.sort}
              onChange={(value) =>
                updateState({ sort: value }, { replace: true, resetPage: true })
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
            </Button>
            <HelpDialog />
            <CopyLinkButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 px-4 py-6">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch">
          <aside className="hidden lg:block">
            <FiltersPanel
              state={state}
              providers={meta.providers}
              modalitiesIn={meta.modalitiesIn}
              modalitiesOut={meta.modalitiesOut}
              onUpdate={updateState}
            />
          </aside>

          <section>
            <ResultsPanel
              items={searchData?.items ?? []}
              total={searchData?.total ?? 0}
              page={state.page}
              pageSize={state.pageSize}
              selectedId={selectedId}
              isLoading={searchLoading}
              error={searchError}
              usedStrict={searchData?.usedStrict}
              query={state.q}
              onSelect={handleSelect}
              onPageChange={(page) =>
                updateState({ page }, { replace: true, resetPage: false })
              }
              onPageSizeChange={(pageSize) =>
                updateState({ pageSize, page: 1 }, { replace: true })
              }
            />
          </section>

          <aside className="hidden min-h-0 lg:flex lg:flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <DetailsPanel
                summary={selectedSummary}
                detail={detailData?.detail ?? null}
                isLoading={detailLoading}
                error={detailError}
                onClearSelection={handleClearSelection}
              />
            </div>
          </aside>
        </div>
      </main>

      <Sheet
        open={isMobile && filtersOpen}
        onOpenChange={handleFiltersOpenChange}
      >
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FiltersPanel
              state={state}
              providers={meta.providers}
              modalitiesIn={meta.modalitiesIn}
              modalitiesOut={meta.modalitiesOut}
              onUpdate={updateState}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isMobile && Boolean(selectedId)}
        onOpenChange={handleDetailsOpenChange}
      >
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Model details</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <DetailsPanel
              summary={selectedSummary}
              detail={detailData?.detail ?? null}
              isLoading={detailLoading}
              error={detailError}
              onClearSelection={handleClearSelection}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
