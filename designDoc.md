# Design doc

## What you are building

A Next.js web app that helps people

* Find models that match requirements
* Estimate token cost
* Find open weights alternatives
* Share a clean spec sheet link

No auth. No database. No user data stored.

One external source

* Models.dev catalog at `https://models.dev/api.json`
* Provider logos at `https://models.dev/logos/{provider}.svg`

You already have a Bun and shadcn project set up. This doc assumes that.

## Goals

Performance goals

* Clicking filters and buttons should feel instant
* Search typing should stay smooth
* Results should render fast even on mid laptops
* Model details should show something right away, then fill in

Product goals

* No tabs
* One clear flow that teaches itself
* Explanations in the right places
* Not cluttered

Ops goals

* No DB to maintain
* Daily refresh of the catalog
* Simple deploy to Vercel

## Non goals

* No prompt playground
* No benchmarking or quality claims
* No user projects or saved work
* No provider API key setup

## Why it is slow today

This pattern causes lag in React apps

* A large dataset is in client state
* Every click triggers filtering, sorting, mapping, and re rendering
* The table renders too many rows
* Derived data is recomputed inside render
* The UI blocks while doing work

A DB is one fix, but it is not required. You can get 90 percent of the benefit by moving heavy work to the server and rendering less.

## Core idea

Do not ship the full catalog to the browser.

Instead

* The browser asks your server for a small page of results
* The server keeps a cached copy of Models.dev and filters it
* The browser asks for model details only when a model is selected

This keeps clicks fast because the browser does not do heavy work.

## Architecture

### High level

* Client renders UI and holds small state
* Next.js route handlers do data work
* Next fetch caching keeps the Models.dev dataset fresh daily
* Optional daily warm ping keeps the cache hot

Data flow

1. Request comes in to `/api/search`
2. Server calls `getCatalog()` which returns a cached normalized catalog
3. Server filters and sorts in memory
4. Server returns a page of model summaries
5. Client renders 25 to 50 rows
6. When user selects a model, client calls `/api/model?id=...`
7. Server returns details for that one model

### What runs where

Client

* Search box state
* Filter state from the URL
* Selected model id
* Cost calculator math
* UI rendering

Server

* Fetch and normalize Models.dev
* Cache the normalized catalog
* Filter, sort, and paginate results
* Compute open weights alternatives when requested

## Data source

Models.dev provides model and provider metadata, including costs, limits, modalities, and flags like open weights.

You should assume fields can be missing.

## Data normalization

Normalize once on the server. Keep the client payload small.

### Normalized types

Summary type for lists

```ts
export type ModelSummary = {
  id: string
  name: string | null

  providerId: string
  providerName: string | null
  logoUrl: string | null

  modalitiesIn: string[]
  modalitiesOut: string[]

  contextTokens: number | null
  outputTokens: number | null

  toolCall: boolean | null
  structuredOutput: boolean | null
  openWeights: boolean | null

  status: string | null

  priceInPerMTokens: number | null
  priceOutPerMTokens: number | null

  releaseDate: string | null
  lastUpdated: string | null
  knowledgeCutoff: string | null

  searchText: string
}
```

Detail type for spec sheet and export

```ts
export type ModelDetail = {
  id: string
  normalized: unknown
  raw: unknown
}
```

Normalization rules

* Always use arrays for modalities
* Use null for unknown booleans and numbers
* Build `logoUrl` using the Models.dev logo path pattern
* Build `searchText` once, lowercase, include id, name, provider, modalities

### In memory indexes

Build these once per catalog refresh

* `byId` map from id to detail
* `summaries` array of ModelSummary
* `providers` list with id, name, logoUrl
* Optional `fuseIndex` or token index for search

Store them in a module level variable in the route handler module. This gives fast responses on warm server instances.

## Caching strategy

You need caching in three places.

### Server side catalog caching

Use Next fetch caching when retrieving Models.dev.

* Revalidate every 24 hours
* When the cache is valid, all API calls reuse it
* When expired, the first request triggers a refresh

This avoids fetching Models.dev on every user request.

### API response caching

Add cache headers on your own endpoints.

* `/api/model` can cache longer, hours to a day
* `/api/search` can cache short, tens of seconds, because it depends on query params

Even short caching helps when multiple users do similar searches.

### Client side caching

Use TanStack Query or SWR.

* Cache `/api/search` by its query params
* Cache `/api/model` by model id
* Use stale time similar to your server cache or shorter

This makes back navigation and repeated clicks feel instant.

### Optional daily warm

If you want the cache to refresh even when nobody visits

* Add a Vercel Cron job that calls `/api/warm?secret=...` once a day
* `/api/warm` calls `getCatalog()` and returns ok

This is optional. The app still works without it.

## API design

Keep it small.

### GET /api/search

Purpose
Returns a page of ModelSummary items.

Query params

* q
* providers
* modalitiesIn
* modalitiesOut
* toolCall
* structuredOutput
* openWeights
* minContext
* minOutput
* maxPriceIn
* maxPriceOut
* hideDeprecated
* sort
* page
* pageSize

Response shape

```json
{
  "page": 1,
  "pageSize": 25,
  "total": 1234,
  "items": [
    {
      "id": "provider/model",
      "name": "Model Name",
      "providerId": "provider",
      "providerName": "Provider",
      "logoUrl": "https://models.dev/logos/provider.svg",
      "modalitiesIn": ["text"],
      "modalitiesOut": ["text"],
      "contextTokens": 200000,
      "outputTokens": 8192,
      "toolCall": true,
      "structuredOutput": true,
      "openWeights": false,
      "status": "stable",
      "priceInPerMTokens": 1.0,
      "priceOutPerMTokens": 3.0,
      "releaseDate": "2025-01-01",
      "lastUpdated": "2025-12-01",
      "knowledgeCutoff": "2025-10",
      "searchText": "..."
    }
  ]
}
```

Filtering rules

* If a filter is required and the field is null, treat it as not matching
* If a max price filter is set and price is null, exclude unless user enabled include unknown

Sorting options

* Best match
* Cheapest using a default token assumption
* Largest context
* Recently updated

Pagination

* Default pageSize 25
* Max pageSize 50

### GET /api/model

Purpose
Return one model detail, plus enough summary to show the panel instantly.

Query params

* id

Response

```json
{
  "summary": { /* ModelSummary */ },
  "detail": { /* ModelDetail */ }
}
```

Server behavior

* Find by id using `byId`
* If not found, 404 with a short message

### GET /api/alternatives

Purpose
Open weights alternatives for one model.

Query params

* id
* limit (max 10)

Response

```json
{
  "baseId": "provider/model",
  "items": [
    {
      "id": "other/model",
      "score": 92,
      "reasons": ["Matches modalities", "Similar context", "Supports tool calling"],
      "summary": { /* ModelSummary */ }
    }
  ]
}
```

Important
Do not compute alternatives for every model on every search. Compute on demand when the user clicks the button in the details panel. Cache it in memory with a TTL.

### GET /api/warm

Optional.

* Protected with a secret
* Calls `getCatalog()`
* Returns ok

## Search and ranking

### Search behavior

Simple and fast is enough.

* If query looks like an id, prefer id match
* Otherwise split query into tokens
* Require all tokens to match `searchText` for strict mode
* Allow any token for loose mode when no results

Add fuzzy search only if needed. If you do, build the index once per refresh, not per request.

### Best match score

Explainable scoring.

Hard requirements

* Required modalities must be present
* Required tool calling and structured output must be true
* Context and output limits must meet minimum

Soft score

* Context closeness
* Output closeness
* Cost availability when user cares about cost
* Penalize deprecated

Expose a small explanation only in the right panel, not in every row.

## Cost calculator

This runs in the browser. It is instant.

Inputs

* Input tokens per call
* Output tokens per call
* Calls per day or per month

Optional advanced inputs that show only when pricing exists

* Reasoning tokens
* Cache read and write tokens
* Audio tokens

Outputs

* Cost per call
* Cost per day
* Cost per month
* Breakdown list

Rules

* If pricing is missing, show a clear message
* If partial pricing exists, compute partial and label it

Explainability

* Show the formula in a small collapsible area
* Add a one line note that tokens vary by prompt and output length

No extra server calls needed.

## Open weights alternatives

This feature needs server help since the client does not have the full catalog.

Default behavior when a model is selected

* User clicks "Find open weights alternatives"
* Server returns the nearest open weights models using weighted similarity
* Modalities and capabilities are soft signals, not hard filters
* Open weights must be true

UI rule
Load alternatives only when the user clicks the button. Show skeleton first.

Explainability

* Show a score 0 to 100
* Show 2 to 4 short reason chips
* Show key deltas, like context smaller or missing tool calling

## Spec sheet and export

Two places

* Right panel section called Export and share
* Dedicated page at `/model/[...id]`

Spec sheet sections

* Overview
* Capabilities
* Limits
* Pricing
* Dates
* Links

Actions

* Copy model id
* Copy Markdown
* Copy JSON snippet
* Copy share URL

Markdown export rules

* Keep it short
* Omit unknown fields
* Use consistent labels

JSON export rules

* Provide a config friendly shape
* Omit unknown fields

## UI and UX design

No tabs. One workspace.

### Layout

Desktop

* Top bar
* Resizable three panel layout

  * Left filters
  * Center results
  * Right selected model workspace

Mobile

* Top bar
* Results list
* Filters in a Sheet
* Details in a Sheet

### Top bar

Contains

* Search input with typeahead
* Sort dropdown
* Help button
* Copy link button

Search typeahead

* Use shadcn Command
* Show top 10 suggestions
* Keyboard navigation works
* Selecting a suggestion sets selected model id and updates results

Help button

* Opens a Dialog
* Short text only
* Three steps

  * Set requirements
  * Pick a model
  * Review cost and alternatives

### Left panel filters

Keep it small and teachable.

At top, presets

* Tool calling
* Open weights only
* Vision input
* Long context

Then an Accordion with groups

* Capabilities
* Limits
* Modalities
* Pricing
* Provider
* Status

Default open

* Capabilities
* Limits

Default closed

* Modalities
* Pricing
* Provider
* Status

This avoids clutter.

Explainability in filters

* Small info icon next to group titles
* Tooltip text is one sentence

### Center panel results

Table on desktop, cards on mobile.

Keep columns minimal

* Model name and id
* Provider with logo
* Modalities chips
* Context tokens
* Tool calling icon
* Open weights icon
* Price summary or unknown

Pagination

* Always paginate
* Page size 25 by default

Interaction

* Clicking a row highlights instantly
* The right panel opens instantly with summary content
* Details load after

Loading states

* Use skeleton rows for list loads
* Use skeleton blocks in the right panel

### Right panel workspace

This is the heart of the app.

Use Accordion sections

Section At a glance
Open by default.

* Name, id, provider, badges
* Modalities
* Tool calling and structured output
* Context and output tokens
* Pricing summary
* Warning if deprecated

Section Cost estimate
Closed by default.

* Inputs on top
* Results below
* Breakdown
* A short note about estimates

Section Open weights alternatives
Closed by default.

* Prefilled constraints
* Relax constraints button
* Results list with score, reasons, and key deltas

Section Export and share
Closed by default.

* Copy id
* Copy Markdown
* Copy JSON
* Open spec page

### Explainable UI patterns

Use a consistent approach

* Tooltip for one sentence definitions
* HoverCard for two to three sentences
* Alerts only for real warnings
* Empty states that teach, not blame

Example tooltip text

* Tool calling
  Model can return tool names and arguments for your app to run.

* Open weights
  Weights are available publicly. License and hosting still vary.

### Avoiding clutter

Rules

* Keep the table simple
* Put deep details in the right panel
* Hide advanced filters by default
* Hide advanced cost buckets by default
* Only show warnings when needed

## State management

Use the URL for state so links are shareable.

Query params

* q
* sort
* page
* pageSize
* selected
* providers
* modalitiesIn
* modalitiesOut
* toolCall
* structuredOutput
* openWeights
* minContext
* minOutput
* maxPriceIn
* maxPriceOut
* hideDeprecated

Rules

* While typing search, update URL with replaceState
* When selecting a model, use pushState
* Parse URL on load to restore state

## Performance plan

This is the part that makes it feel good.

Client rules

* Never load the whole catalog into the client
* Always paginate list results
* Debounce search input, around 200 ms
* Use `useTransition` for filter changes
* Use `useDeferredValue` for the typed query
* Do not compute derived arrays inside render
* Memoize any mapping of list items to rows
* Keep selection as id only
* Prefetch model details only when needed

  * Optional prefetch on row hover for desktop

Server rules

* Normalize and index once per refresh
* Keep list filtering fast and simple
* Return small payloads
* Cache `/api/model` longer than `/api/search`
* Avoid expensive per request work like building a search index

Network rules

* Compress JSON responses
* Avoid returning raw model detail unless needed
* For the list endpoint, never return raw

Rendering rules

* Prefer fixed row height tables
* Add virtualization if you ever show more than 50 rows at once
* Keep icons and badges lightweight

Measuring

* Add basic timing logs on server for catalog load and search time
* Use web vitals in Next.js to track client performance
* Add a simple debug panel in dev that shows

  * list response time
  * detail response time
  * number of rows rendered

## Error handling

Models.dev fetch fails

* Serve the last cached catalog if available
* Return a friendly error if nothing is cached

Schema changes

* Use Zod to validate and coerce
* Ignore unknown fields
* Treat missing fields as null

API errors in the UI

* Show an Alert in the list area for list failures
* Show an Alert in the right panel for detail failures
* Provide a retry button

## Security and privacy

* No user data stored
* No cookies needed
* Do not render raw HTML from external data
* If you add `/api/warm`, protect it with a secret
* Keep any server secrets only in server env vars

Optional

* Basic rate limiting later if you see abuse
* Keep it off for v1 to stay simple

## Testing plan

Unit tests

* Normalization from Models.dev raw into ModelSummary and ModelDetail
* Filtering and sorting logic
* Best match scoring
* Cost calculator math
* Alternatives scoring

Integration tests

* `/api/search` returns paginated results
* `/api/model` returns 404 for unknown id
* `/api/model` returns summary plus detail for known id
* `/api/alternatives` returns only open weights models

E2E tests with Playwright

* Search, filter, select a model
* Cost estimate updates
* Open weights alternatives load on button click
* Copy actions work

## Deployment

Target is Vercel.

You already use Bun and shadcn.

Deployment notes

* Make sure `bun.lockb` is committed
* Use Bun scripts for dev and build
* Keep route handlers on Node runtime for compatibility unless you have a reason to go Edge

Env vars

* Optional `WARM_SECRET` if you add `/api/warm`
* Optional `NEXT_PUBLIC_APP_URL` for building absolute share links

## Suggested project structure

```txt
app/
  page.tsx
  model/
    [...id]/
      page.tsx
  api/
    search/
      route.ts
    model/
      route.ts
    alternatives/
      route.ts
    warm/
      route.ts

components/
  layout/
    AppShell.tsx
    Panels.tsx
  topbar/
    SearchCommand.tsx
    SortMenu.tsx
    HelpDialog.tsx
    CopyLinkButton.tsx
  filters/
    Presets.tsx
    FiltersAccordion.tsx
  results/
    ResultsTable.tsx
    ResultsPagination.tsx
  details/
    DetailsPanel.tsx
    AtAGlance.tsx
    CostSection.tsx
    AlternativesSection.tsx
    ExportSection.tsx
  common/
    TooltipInfo.tsx
    SkeletonBlocks.tsx
    CopyButton.tsx

lib/
  catalog/
    fetchCatalog.ts
    normalize.ts
    index.ts
    types.ts
  search/
    filter.ts
    sort.ts
    score.ts
  cost/
    calc.ts
  url/
    state.ts
```

## Phases

### Phase 1 Fix lag without changing the UI much

Deliverables

* Add pagination to results
* Stop storing the whole catalog in client state
* Use `/api/search` and `/api/model` endpoints
* Add skeleton loading for list and detail

Success check

* Clicking a filter shows instant UI feedback
* Page stays responsive while searching

### Phase 2 Redesign UI into a single workspace

Deliverables

* Replace tabs with three panel explorer
* Right panel with accordion sections
* Add tooltips and a short help dialog
* Improve empty states

Success check

* A new user can understand the flow in under a minute

### Phase 3 Open weights alternatives

Deliverables

* Add `/api/alternatives`
* Load alternatives only on button click
* Add score and reason chips

Success check

* Alternatives load fast and feel understandable

### Phase 4 Spec sheet page and exports

Deliverables

* `/model/[...id]` shareable page
* Copy Markdown and JSON
* Print friendly layout

Success check

* Shared spec link loads fast and looks clean

### Phase 5 Polish

Deliverables

* Accessibility pass
* Performance audit
* Add tests
* Optional daily warm cron

Success check

* No noticeable lag on common actions
* No fragile UI states
