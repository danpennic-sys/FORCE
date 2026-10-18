# FORCE

**Force-multiplier voice engine** — overlapping voices in a room → machine-readable code.

Local compiler. No remote model required for the core path. Browser Web Speech API for capture; Node CLI for batch rooms.

## Why

In a war room, several people talk at once. FORCE attributes utterances, merges same-speaker windows, and compiles stable intents (`register_schedule`, `add_dependency`, `fire_once`, …) that downstream systems can execute — e.g. Operator Pages scheduler / MCP.

## Quick start

```bash
# Node 18+
node dist/cli.js            # sample war room
node --test dist/compiler.test.js

# Browser surface
npx serve public -p 4173
# open http://127.0.0.1:4173
```

## Architecture

```
Speakers → Utterances → merge window → compileUtterance → CompiledIntent[]
                                              ↓
                                    JSON / DSL code export
                                              ↓
                         (optional) MCP / ScheduleStore / engine
```

- **`src/compiler.ts`** / **`dist/compiler.js`** — deterministic pattern compiler
- **`src/room.ts`** / **`dist/room.js`** — multi-speaker room state
- **`public/`** — mic + live compile (Web Speech; gated after mount)
- **`briefings/`** — precompiled phrase cards for offline ops

## Intent surface (v0)

| Kind | Payload highlights |
|------|--------------------|
| `register_schedule` | `agent_id`, `kind`, `expression` |
| `add_dependency` | `agent_id`, `depends_on`, `min_generation` |
| `fire_once` | `agent_id` |
| `query_status` | `agent_id` |
| `note` | free text fallback |

## Design constraints

- **Local-first:** core compile path never calls a remote LLM
- **Mic after mount:** avoid hydration mismatch probing `window` during SSR
- **Allowlist downstream:** compiled rows are data, not arbitrary code execution
- **Loopback when bridged:** same control-plane rules as Operator Pages MCP

## Status

Scaffold + local compiler + browser fallback + sample room. Bridge to `real-execution-engine` / MCP is next, not in this commit’s fire path.

## License

MIT
