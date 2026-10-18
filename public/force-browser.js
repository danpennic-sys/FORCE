/**
 * FORCE browser surface — Web Speech + local pattern compiler (no remote).
 */
const PATTERNS = [
  {
    kind: "register_schedule",
    re: /\b(?:register|schedule|set up)\s+(?:agent\s+)?([\w-]+)\s+(?:every|interval)\s+(\d+)\s*(?:s|sec|seconds)?/i,
    code: (m) =>
      `register_schedule({ agent_id: "${m[1]}", kind: "interval", expression: "${m[2]}" })`,
  },
  {
    kind: "add_dependency",
    re: /\b(?:depend|depends|after)\s+([\w-]+)\s+(?:on|after)\s+([\w-]+)(?:\s+(?:gen|generation)\s+(\d+))?/i,
    code: (m) =>
      `add_dependency("${m[1]}", "${m[2]}", ${m[3] ? Number(m[3]) : 1})`,
  },
  {
    kind: "fire_once",
    re: /\b(?:fire|run|trigger)\s+(?:agent\s+)?([\w-]+)/i,
    code: (m) => `fire_once("${m[1]}")`,
  },
  {
    kind: "query_status",
    re: /\b(?:status|completed|how many)\s+(?:for\s+)?([\w-]+)/i,
    code: (m) => `get_completed("${m[1]}")`,
  },
];

function compileLine(text) {
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) return { kind: p.kind, code: p.code(m), text };
  }
  return { kind: "note", code: `// note: ${JSON.stringify(text)}`, text };
}

const lines = [];
const transcriptEl = document.getElementById("transcript");
const codeEl = document.getElementById("code");
const micState = document.getElementById("micState");
const btnListen = document.getElementById("btnListen");
const btnStop = document.getElementById("btnStop");

function render() {
  transcriptEl.textContent = lines.map((l) => `• ${l}`).join("\n") || "(empty)";
  const compiled = lines.map(compileLine);
  codeEl.textContent =
    compiled.map((c) => `// ${c.kind}\n${c.code}`).join("\n\n") || "// —";
}

btnListen.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    micState.textContent = "speech API unavailable";
    micState.classList.add("live");
    return;
  }
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";
  rec.onstart = () => {
    micState.textContent = "listening";
    micState.classList.add("live");
    btnListen.disabled = true;
    btnStop.disabled = false;
  };
  rec.onend = () => {
    micState.textContent = "mic idle";
    micState.classList.remove("live");
    btnListen.disabled = false;
    btnStop.disabled = true;
  };
  rec.onresult = (ev) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      if (ev.results[i].isFinal) {
        lines.push(ev.results[i][0].transcript.trim());
        render();
      }
    }
  };
  window.__forceRec = rec;
  rec.start();
});

btnStop.addEventListener("click", () => {
  window.__forceRec?.stop();
});

document.getElementById("btnDemo").addEventListener("click", () => {
  lines.push(
    "register agent backup every 120 seconds",
    "depend ingest on backup generation 1",
    "fire agent backup once",
    "status for backup"
  );
  render();
});

document.getElementById("btnClear").addEventListener("click", () => {
  lines.length = 0;
  render();
});

render();
