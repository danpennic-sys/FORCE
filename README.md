# FORCE

**Force-multiplier voice engine** — overlapping voices in a room → machine-readable code.

Local compiler. No remote model required for the core path. Browser Web Speech API for capture; Node CLI for batch rooms.

## Quick start

```bash
node dist/cli.js
node --test dist/compiler.test.js
npx serve public -p 4173
```

## Intent surface (expanded)

| Kind | Payload highlights |
|------|--------------------|
| `register_schedule` | `agent_id`, `kind` (interval/cron/once), `expression` |
| `set_enabled` | `agent_id`, `enabled` |
| `add_dependency` | `agent_id`, `depends_on`, `min_generation` |
| `remove_dependency` | `agent_id`, `depends_on` |
| `fire_once` | `agent_id` |
| `query_status` | `agent_id` |
| `list_schedules` | — |
| `export_snapshot` | — |
| `note` / `unknown` | free text / empty |

Minutes in interval phrases expand to seconds. `compileActionable()` drops notes.

## Design constraints

- Local-first: core path never calls a remote LLM
- Mic after user gesture
- Compiled rows are data, not arbitrary execution
- Bridge to Operator Pages MCP / ScheduleStore is optional downstream

## License

MIT
