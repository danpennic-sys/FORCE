import { Room } from "./room.js";

const room = new Room("war-1", "Ops War Room");
const alice = room.addSpeaker("Alice", "ops");
const bob = room.addSpeaker("Bob", "lead");
const t0 = Date.now();
room.say(alice.id, "register agent backup every 120 seconds", t0);
room.say(bob.id, "depend ingest on backup generation 1", t0 + 400);
room.say(alice.id, "fire agent backup once", t0 + 900);
room.say(bob.id, "status for backup", t0 + 1500);

const intents = room.compile();
console.log("=== FORCE compiled intents ===\n");
for (const i of intents) {
  console.log(`[${i.kind}] ${i.summary}`);
  console.log(`  code: ${i.code}`);
  console.log(`  payload: ${JSON.stringify(i.payload)}\n`);
}
console.log("=== JSON export ===");
console.log(room.exportIntents());
