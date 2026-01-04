# Models Explorer

A snarky little wrapper around models.dev that pretends to be humble while it actually filters, ranks, and serves up open-weights alternatives with flair.

## Overview

Models Explorer is a Next.js app for finding AI models, estimating token cost, and comparing open-weights alternatives. It uses the models.dev catalog as the single source of truth and does not store user data.

## Data sources

- Catalog: https://models.dev/api.json
- Provider logos: https://models.dev/logos/{provider}.svg
- Cache: server fetch revalidates daily; alternatives are computed on demand and cached in memory with a TTL.

## Requirements

- Bun

## Quickstart

```bash
bun install
bun dev
```

Open http://localhost:3000.

## Scripts

```bash
bun dev
bun run build
bun run start
bun run lint
bun run test
```

## API endpoints

- `GET /api/search`
  - Query params: `q`, `providers`, `modalitiesIn`, `modalitiesOut`, `toolCall`, `structuredOutput`, `temperature`, `openWeights`, `reasoning`, `minContext`, `minOutput`, `maxPriceIn`, `maxPriceOut`, `hideDeprecated`, `sort`, `page`, `pageSize`
  - Returns: paged `ModelSummary` list
- `GET /api/model`
  - Query params: `id`
  - Returns: `ModelSummary` + `ModelDetail`
- `GET /api/alternatives`
  - Query params: `id`, `limit` (max 10)
  - Returns: nearest open-weights alternatives with score and reasons
- `GET /api/warm` (optional)
  - Protected by `WARM_SECRET`

## Open-weights alternatives

Alternatives are computed on button click and rank all open-weights models using weighted similarity:
- Modalities match: 20
- Context closeness: 25
- Output closeness: 15
- Capability parity (tool calling, structured output, reasoning, temperature): 20
- Price competitiveness: 10
- Recency: 10
- Deprecated penalty: -20

Missing fields are neutral except missing price when base pricing exists.

## Environment variables

- `WARM_SECRET` (optional): secures `/api/warm`
- `NEXT_PUBLIC_APP_URL` (optional): used for absolute share links

## Links

- models.dev: https://models.dev
- models.dev repo: https://github.com/anomalyco/models.dev
- This project: https://github.com/siddhantparadox/models
