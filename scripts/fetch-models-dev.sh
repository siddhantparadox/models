#!/usr/bin/env bash
set -euo pipefail

url="https://models.dev/api.json"
out="allOutputs.md"

if [[ ${1:-} == "" ]]; then
  echo "Usage: $(basename "$0") provider/model"
  echo "Example: $(basename "$0") openai/gpt-4o"
  exit 1
fi

provider="${1%%/*}"
model="${1#*/}"

if [[ "$provider" == "$model" ]]; then
  echo "Expected provider/model (e.g., openai/gpt-4o)"
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

curl -fsSL "$url" -o "$tmp"

PROVIDER="$provider" MODEL="$model" INPUT="$tmp" node - <<'NODE' > "$out"
const fs = require("fs");

const provider = process.env.PROVIDER;
const model = process.env.MODEL;
const input = process.env.INPUT;

const raw = fs.readFileSync(input, "utf8");
const data = JSON.parse(raw);

const providerEntry = data[provider];
if (!providerEntry || typeof providerEntry !== "object") {
  console.error(`Provider not found: ${provider}`);
  process.exit(2);
}

const models = providerEntry.models;
if (!models || typeof models !== "object" || !models[model]) {
  console.error(`Model not found: ${provider}/${model}`);
  process.exit(3);
}

const trimmedProvider = { ...providerEntry, models: { [model]: models[model] } };
const result = { [provider]: trimmedProvider };

process.stdout.write(JSON.stringify(result, null, 2));
NODE

echo "Wrote $(wc -c < "$out") bytes to $out"
