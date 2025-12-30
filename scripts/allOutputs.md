{
  "openai": {
    "id": "openai",
    "env": [
      "OPENAI_API_KEY"
    ],
    "npm": "@ai-sdk/openai",
    "name": "OpenAI",
    "doc": "https://platform.openai.com/docs/models",
    "models": {
      "gpt-4o": {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "family": "gpt-4o",
        "attachment": true,
        "reasoning": false,
        "tool_call": true,
        "structured_output": true,
        "temperature": true,
        "knowledge": "2023-09",
        "release_date": "2024-05-13",
        "last_updated": "2024-08-06",
        "modalities": {
          "input": [
            "text",
            "image"
          ],
          "output": [
            "text"
          ]
        },
        "open_weights": false,
        "cost": {
          "input": 2.5,
          "output": 10,
          "cache_read": 1.25
        },
        "limit": {
          "context": 128000,
          "output": 16384
        }
      }
    }
  }
}