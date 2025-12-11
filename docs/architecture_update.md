# Architecture Update: OpenRouter Integration

## Why?
The user's Google API Key was incompatible with the direct Google Generative AI SDK (likely a Vertex AI or Service Account key context). We switched to OpenRouter to allow flexibility and use the `google/gemini-2.5-flash` model.

## Changes
- **SDK**: Replaced `@google/generative-ai` with `openai` (configured for OpenRouter).
- **Endpoint**: `https://openrouter.ai/api/v1`
- **Model**: `google/gemini-2.5-flash`
- **Safety**: Added `max_tokens: 1000` to prevent excessive credit reservation errors (402).

## Troubleshooting
- **401 Unauthorized**: Invalid API Key. Check OpenRouter key.
- **402 Payment Required**: Insufficient credits or `max_tokens` too high. We fixed the latter by capping tokens.
