import { compileRoomWindow, compileUtterance } from "./compiler.js";

let seq = 0;
function nid(prefix) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export class Room {
  constructor(id, name) {
    this.state = { id, name, speakers: [], utterances: [], compiled: [] };
  }
  addSpeaker(name, role) {
    const s = { id: nid("spk"), name, role };
    this.state.speakers.push(s);
    return s;
  }
  say(speakerId, text, at = Date.now()) {
    const u = { id: nid("utt"), speakerId, text, at };
    this.state.utterances.push(u);
    return u;
  }
  compile() {
    this.state.compiled = compileRoomWindow(this.state.utterances);
    return this.state.compiled;
  }
  exportIntents() {
    return JSON.stringify(this.state.compiled, null, 2);
  }
}
