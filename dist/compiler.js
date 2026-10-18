const PATTERNS = [
  {
    kind: "register_schedule",
    re: /\b(?:register|schedule|set up)\s+(?:agent\s+)?(?<agent>[\w-]+)\s+(?:every|interval)\s+(?<secs>\d+)\s*(?:s|sec|seconds)?/i,
    build: (m) => {
      const agent = m.groups.agent;
      const secs = m.groups.secs;
      return {
        payload: { agent_id: agent, kind: "interval", expression: secs },
        summary: `Register interval schedule for ${agent} every ${secs}s`,
        code: `register_schedule({ agent_id: "${agent}", kind: "interval", expression: "${secs}" })`,
      };
    },
  },
  {
    kind: "register_schedule",
    re: /\b(?:register|schedule)\s+(?:agent\s+)?(?<agent>[\w-]+)\s+(?:cron)\s+(?<cron>.+)$/i,
    build: (m) => {
      const agent = m.groups.agent;
      const cron = m.groups.cron.trim();
      return {
        payload: { agent_id: agent, kind: "cron", expression: cron },
        summary: `Register cron schedule for ${agent}`,
        code: `register_schedule({ agent_id: "${agent}", kind: "cron", expression: "${cron}" })`,
      };
    },
  },
  {
    kind: "add_dependency",
    re: /\b(?:depend|depends|after)\s+(?<consumer>[\w-]+)\s+(?:on|after)\s+(?<producer>[\w-]+)(?:\s+(?:gen|generation)\s+(?<gen>\d+))?/i,
    build: (m) => {
      const consumer = m.groups.consumer;
      const producer = m.groups.producer;
      const gen = m.groups.gen ? Number(m.groups.gen) : 1;
      return {
        payload: { agent_id: consumer, depends_on: producer, min_generation: gen },
        summary: `${consumer} depends on ${producer} (min gen ${gen})`,
        code: `add_dependency("${consumer}", "${producer}", ${gen})`,
      };
    },
  },
  {
    kind: "fire_once",
    re: /\b(?:fire|run|trigger)\s+(?:agent\s+)?(?<agent>[\w-]+)\s*(?:once)?/i,
    build: (m) => {
      const agent = m.groups.agent;
      return {
        payload: { agent_id: agent },
        summary: `Fire once: ${agent}`,
        code: `fire_once("${agent}")`,
      };
    },
  },
  {
    kind: "query_status",
    re: /\b(?:status|completed|how many)\s+(?:for\s+)?(?<agent>[\w-]+)/i,
    build: (m) => {
      const agent = m.groups.agent;
      return {
        payload: { agent_id: agent },
        summary: `Query status for ${agent}`,
        code: `get_completed("${agent}")`,
      };
    },
  },
];

export function compileUtterance(u) {
  const text = u.text.trim();
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
