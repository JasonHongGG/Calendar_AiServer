# Calendar AI Server

This is a standalone AI command server for the Flutter calendar app. It exposes a simple HTTP endpoint to accept natural language commands and returns structured actions.

## Endpoints

- `POST /command` `{ "input": "..." }`
- `GET /health`

## Architecture

- `IAIClient`: interface for AI providers.
- `CopilotAiClient`: Copilot SDK adapter (placeholder logic included).
- `AiClientFactory`: factory for provider selection via `AI_PROVIDER`.

## Example Response

```json
{
  "actions": [
    {
      "type": "add_event",
      "payload": {
        "title": "開會",
        "startDate": "2026-02-03T09:00:00.000Z",
        "endDate": "2026-02-03T10:00:00.000Z",
        "isAllDay": false,
        "colorIndex": 2
      }
    }
  ],
  "message": "已接收指令"
}
```
