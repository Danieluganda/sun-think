import assert from "node:assert/strict";
import test from "node:test";
import { parseSrt } from "../src/srt/parser.js";
import { rebuildSrt } from "../src/srt/rebuilder.js";
import { validateCues } from "../src/srt/validator.js";

test("parses and rebuilds SRT cues", () => {
  const input = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:05,500
Second cue`;

  const cues = parseSrt(input);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "Hello world");
  assert.deepEqual(validateCues(cues), { valid: true, errors: [] });
  assert.match(rebuildSrt(cues), /00:00:04,000 --> 00:00:05,500/);
});
