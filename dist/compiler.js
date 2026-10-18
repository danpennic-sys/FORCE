/**
 * FORCE local compiler — expanded phrase grammar.
 * Deterministic. No remote LLM on this path.
 */

const PATTERNS = [
  {
    kind: "register_schedule",
    re: /\b(?:register|schedule|set\s*up|create|add)\s+(?:an?\s+)?(?:agent\s+)?(?<agent>[\w.-]+)\s+(?:to\s+run\s+)?(?:every|interval|each)\s+(?<secs>\d+)\s*(?:s|sec|secs|seconds|m|min|mins|minutes)?/i,
    build: (m) => {
      const agent = m.groups.agent;
      let secs = Number(m.groups.secs);
      const unit = (m[0].match(/\d+\s*(m|min|mins|minutes)\b/i) || [])[1];
      if (unit) secs *= 60;
      return {
        payload: { agent_id: agent, kind: "interval", expression: String(secs) },
        summary: `Register interval schedule for ${agent} every ${secs}s`,
        code: `register_schedule({ agent_id: "${agent}", kind: "interval", expression: "${secs}" })`,
      };
    },
  },
  {
    kind: "register_schedule",
    re: /\b(?:register|schedule|set\s*up)\s+(?:an?\s+)?(?:agent\s+)?(?<agent>[\w.-]+)\s+(?:on\s+)?(?:a\s+)?cron\s+(?:of\s+)?(?<cron>.+)$/i,
    build: (m) => {
      const agent = m.groups.agent;
      const cron = m.groups.cron.trim().replace(/[.""']+$/g, "");
      return {
        payload: { agent_id: agent, kind: "cron", expression: cron },
        summary: `Register cron schedule for ${agent}`,
        code: `register_schedule({ agent_id: "${agent}", kind: "cron", expression: "${cron}" })`,
      };
    },
  },
  {
    kind: "register_schedule",
    re: /\brun\s+(?:agent\s+)?(?<agent>[\w.-]+)\s+once\s+(?:in|after)\s+(?<secs>\d+)\s*(?:s|sec|seconds)?/i,
    build: (m) => {
      const agent = m.groups.agent;
      const secs = m.groups.secs;
      return {
        payload: { agent_id: agent, kind: "once", expression: secs },
        summary: `Register one-shot for ${agent} in ${secs}s`,
        code: `register_schedule({ agent_id: "${agent}", kind: "once", expression: "${secs}" })`,
      };
    },
  },
  {
    kind: "set_enabled",
    re: /\b(?:disable|pause|stop)\s+(?:agent\s+)?(?<agent>[\w.-]+)/i,
    build: (m) => ({
      payload: { agent_id: m.groups.agent, enabled: false },
      summary: `Disable ${m.groups.agent}`,
      code: `set_enabled("${m.groups.agent}", false)`,
    }),
  },
  {
    kind: "set_enabled",
    re: /\b(?:enable|resume|unpause|start)\s+(?:agent\s+)?(?<agent>[\w.-]+)(?:\s+schedule)?/i,
    build: (m) => ({
      payload: { agent_id: m.groups.agent, enabled: true },
      summary: `Enable ${m.groups.agent}`,
      code: `set_enabled("${m.groups.agent}", true)`,
    }),
  },
  {
    kind: "add_dependency",
    re: /\b(?:depend|depends|make)\s+(?<consumer>[\w.-]+)\s+(?:depend\s+)?(?:on|after)\s+(?<producer>[\w.-]+)(?:\s+(?:at\s+)?(?:gen|generation|gen\.)\s*(?<gen>\d+))?/i,
    build: (m) => {
      const gen = m.groups.gen ? Number(m.groups.gen) : 1;
      return {
        payload: { agent_id: m.groups.consumer, depends_on: m.groups.producer, min_generation: gen },
        summary: `${m.groups.consumer} depends on ${m.groups.producer} (min gen ${gen})`,
        code: `add_dependency("${m.groups.consumer}", "${m.groups.producer}", ${gen})`,
      };
    },
  },
  {
    kind: "add_dependency",
    re: /\b(?<consumer>[\w.-]+)\s+(?:should\s+)?(?:wait\s+for|after)\s+(?<producer>[\w.-]+)(?:\s+(?:gen|generation)\s*(?<gen>\d+))?/i,
    build: (m) => {
      const gen = m.groups.gen ? Number(m.groups.gen) : 1;
      return {
        payload: { agent_id: m.groups.consumer, depends_on: m.groups.producer, min_generation: gen },
        summary: `${m.groups.consumer} waits for ${m.groups.producer} (min gen ${gen})`,
        code: `add_dependency("${m.groups.consumer}", "${m.groups.producer}", ${gen})`,
      };
    },
  },
  {
    kind: "fire_once",
    re: /\b(?:fire|run|trigger|execute|kick\s*off)\s+(?:agent\s+)?(?<agent>[\w.-]+)(?:\s+once)?/i,
    build: (m) => ({
      payload: { agent_id: m.groups.agent },
      summary: `Fire once: ${m.groups.agent}`,
      code: `fire_once("${m.groups.agent}")`,
    }),
  },
  {
    kind: "query_status",
    re: /\b(?:status|completed|how\s+many|count|progress)\s+(?:for\s+|of\s+)?(?<agent>[\w.-]+)/i,
    build: (m) => ({
      payload: { agent_id: m.groups.agent },
      summary: `Query status for ${m.groups.agent}`,
      code: `get_completed("${m.groups.agent}")`,
    }),
  },
  {
    kind: "list_schedules",
    re: /\b(?:list|show|what)\s+(?:all\s+)?(?:the\s+)?(?:schedules|agents|jobs)\b/i,
    build: () => ({
      payload: {},
      summary: "List schedules",
      code: `list_schedules()`,
    }),
  },
  {
    kind: "export_snapshot",
    re: /\b(?:export|take|save)\s+(?:a\s+)?(?:snapshot|backup\s+of\s+(?:the\s+)?state)\b/i,
    build: () => ({
      payload: {},
      summary: "Export scheduler snapshot",
      code: `export_snapshot()`,
    }),
  },
  {
    kind: "remove_dependency",
    re: /\b(?:remove|drop|clear)\s+(?:the\s+)?(?:dependency|dep)\s+(?:from\s+)?(?<consumer>[\w.-]+)\s+(?:on|to)\s+(?<producer>[\w.-]+)/i,
    build: (m) => ({
      payload: { agent_id: m.groups.consumer, depends_on: m.groups.producer },
      summary: `Remove dependency ${m.groups.consumer} → ${m.groups.producer}`,
      code: `remove_dependency("${m.groups.consumer}", "${m.groups.producer}")`,
    }),
  },
];

export function compileUtterance(u) {
  const text = u.text.trim();
  if (!text) {
    return { kind: "unknown", payload: {}, sources: [u.id], summary: "empty utterance", code: "// empty" };
  }
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) {
      const built = p.build(m, u);
      return { kind: p.kind, sources: [u.id], ...built };
    }
  }
  return {
    kind: "note",
    payload: { text },
    sources: [u.id],
    summary: `Note: ${text.slice(0, 80)}`,
    code: `// note: ${JSON.stringify(text)}`,
  };
}

export function compileRoomWindow(utterances, windowMs = 2500) {
  if (utterances.length === 0) return [];
  const sorted = [...utterances].sort((a, b) => a.at - b.at);
  const merged = [];
  for (const u of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.speakerId === u.speakerId && u.at - last.at <= windowMs) {
      last.text = `${last.text} ${u.text}`.trim();
      last.at = u.at;
    } else {
      merged.push({ ...u });
    }
  }
  return merged.map(compileUtterance);
}

export function compileActionable(utterances, opts = {}) {
  const all = compileRoomWindow(utterances, opts.windowMs ?? 2500);
  if (opts.keepNotes) return all;
  return all.filter((i) => i.kind !== "note" && i.kind !== "unknown");
}

export const INTENT_KINDS = [
  "register_schedule", "set_enabled", "add_dependency", "remove_dependency",
  "fire_once", "query_status", "list_schedules", "export_snapshot", "note", "unknown",
];
