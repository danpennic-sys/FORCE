# FORCE briefing — Ops war room

Speak natural commands; FORCE compiles them locally to machine-readable intents.

## Supported phrases

| Say | Compiles to |
|-----|-------------|
| register agent **name** every **N** seconds | `register_schedule` interval |
| register agent **name** cron **expr** | `register_schedule` cron |
| depend **A** on **B** generation **N** | `add_dependency` |
| fire agent **name** once | `fire_once` |
| status for **name** | `query_status` |

## Downstream

JSON intents map to Operator Pages MCP / `ScheduleStore` (register, dependency, fire) when bridged.
