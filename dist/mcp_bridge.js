/**
 * FORCE → Operator Pages MCP adapter.
 * Proposals only until confirmApply({ confirmed: true }).
 */

export function intentToMcpProposal(intent) {
  const base = { intent, requires_confirm: true };

  switch (intent.kind) {
    case "note":
    case "unknown":
      return { ...base, action: "skip", requires_confirm: false, reason: "non-actionable" };

    case "register_schedule": {
      const p = intent.payload || {};
      const agent = String(p.agent_id || "");
      const kind = String(p.kind || "interval");
      const expression = String(p.expression || "");
      if (!agent || !expression) {
        return { ...base, action: "skip", requires_confirm: false, reason: "missing agent_id or expression" };
      }
      return {
        ...base,
        action: "mcp_call",
        tool: "register_schedule",
        args: { schedule_id: agent, agent_id: agent, kind, expression, enabled: true },
        reason: `MCP register_schedule ${agent} ${kind} ${expression}`,
      };
    }

    case "add_dependency": {
      const p = intent.payload || {};
      const consumer = String(p.agent_id || "");
      const producer = String(p.depends_on || "");
      const min_generation = Number(p.min_generation ?? 1);
      if (!consumer || !producer) {
        return { ...base, action: "skip", requires_confirm: false, reason: "missing agent_id or depends_on" };
      }
      return {
        ...base,
        action: "mcp_call",
        tool: "add_dependency",
        args: { agent_id: consumer, depends_on: producer, min_generation },
        reason: `MCP add_dependency ${consumer} → ${producer} gen≥${min_generation}`,
      };
    }

    case "list_schedules":
      return {
        ...base,
        action: "mcp_call",
        tool: "list_schedules",
        args: { enabled_only: false },
        reason: "MCP list_schedules",
      };

    case "query_status": {
      const agent = String((intent.payload || {}).agent_id || "");
      if (!agent) {
        return { ...base, action: "skip", requires_confirm: false, reason: "missing agent_id" };
      }
      return {
        ...base,
        action: "mcp_call",
        tool: "get_completed",
        args: { agent_id: agent },
        reason: `MCP get_completed ${agent}`,
      };
    }

    case "export_snapshot":
      return {
        ...base,
        action: "mcp_call",
        tool: "export_snapshot",
        args: {},
        reason: "MCP export_snapshot",
      };

    case "set_enabled":
      return {
        ...base,
        action: "pending_engine",
        reason: "set_enabled not in MCP tool surface yet",
      };

    case "remove_dependency":
      return {
        ...base,
        action: "pending_engine",
        reason: "remove_dependency not in MCP tool surface yet",
      };

    case "fire_once":
      return {
        ...base,
        action: "pending_engine",
        reason: "fire_once is engine-owned; never auto-fire from voice",
      };

    default:
      return { ...base, action: "skip", requires_confirm: false, reason: `unknown kind ${intent.kind}` };
  }
}

export function proposeBatch(intents, opts = {}) {
  const list = opts.includeNotes
    ? intents
    : intents.filter((i) => i.kind !== "note" && i.kind !== "unknown");
  return list.map(intentToMcpProposal);
}

export function confirmApply(proposals, decision) {
  if (!decision.confirmed) {
    return {
      applied: [],
      blocked: proposals,
      status: "rejected",
      message: "confirm required — no MCP calls issued",
    };
  }
  const applied = [];
  const blocked = [];
  for (const p of proposals) {
    if (p.action === "skip") {
      blocked.push({ ...p, block_reason: "skip" });
      continue;
    }
    if (p.action === "pending_engine" && !decision.allowPending) {
      blocked.push({ ...p, block_reason: "pending_engine" });
      continue;
    }
    if (p.action === "mcp_call" || (p.action === "pending_engine" && decision.allowPending)) {
      applied.push(p);
    } else {
      blocked.push({ ...p, block_reason: p.action });
    }
  }
  return {
    applied,
    blocked,
    status: "confirmed",
    message: `ready to issue ${applied.filter((a) => a.action === "mcp_call").length} MCP call(s)`,
  };
}

export function formatProposal(p) {
  if (p.action === "mcp_call") {
    return `  [MCP] ${p.tool}(${JSON.stringify(p.args)})  — ${p.reason}`;
  }
  if (p.action === "pending_engine") {
    return `  [PENDING] ${p.intent.kind} ${JSON.stringify(p.intent.payload)}  — ${p.reason}`;
  }
  return `  [SKIP] ${p.intent.kind}  — ${p.reason}`;
}
