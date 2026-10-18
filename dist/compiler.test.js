import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileUtterance, compileRoomWindow } from "./compiler.js";

const u = (text, speakerId = "s1", at = 0) => ({
  id: "u1",
  speakerId,
  text,
  at,
});

describe("FORCE compiler", () => {
  it("registers interval schedule", () => {
    const i = compileUtterance(u("register agent backup every 60 seconds"));
    assert.equal(i.kind, "register_schedule");
    assert.equal(i.payload.agent_id, "backup");
    assert.equal(i.payload.expression, "60");
  });
  it("adds dependency", () => {
    const i = compileUtterance(u("depend ingest on backup generation 2"));
    assert.equal(i.kind, "add_dependency");
    assert.equal(i.payload.min_generation, 2);
  });
  it("fires once", () => {
    const i = compileUtterance(u("fire agent backup once"));
    assert.equal(i.kind, "fire_once");
  });
  it("merges same-speaker window", () => {
    const list = compileRoomWindow([
      { id: "a", speakerId: "s1", text: "register agent", at: 0 },
      { id: "b", speakerId: "s1", text: "backup every 30", at: 500 },
    ]);
    assert.equal(list.length, 1);
    assert.equal(list[0].kind, "register_schedule");
  });
});
