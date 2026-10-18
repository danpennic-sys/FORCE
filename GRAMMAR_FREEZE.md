# Grammar freeze

**Status: FROZEN as of 2026-10-18**

Do not add new phrase patterns or intent kinds without an explicit unfreeze decision.

Allowed work under freeze:
- Bug fixes that preserve existing matches
- MCP adapter / confirm UX
- Tests against frozen fixtures

Intent kinds (closed set):
`register_schedule` | `set_enabled` | `add_dependency` | `remove_dependency` |
`fire_once` | `query_status` | `list_schedules` | `export_snapshot` | `note` | `unknown`
