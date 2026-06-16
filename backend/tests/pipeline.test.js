import assert from "node:assert/strict";
import { mock } from "node:test";
import test from "node:test";
import { parseSrt } from "../src/srt/parser.js";
import { rebuildSrt } from "../src/srt/rebuilder.js";
import { validateCues } from "../src/srt/validator.js";

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:03,000
Hello, welcome to this course.

2
00:00:04,000 --> 00:00:06,000
Today we will learn about AI.

3
00:00:07,000 --> 00:00:09,500
Let us get started.`;

test("pipeline: parse → mock-translate → rebuild preserves structure", () => {
  const cues = parseSrt(SAMPLE_SRT);

  assert.equal(cues.length, 3);
  assert.equal(cues[0].start, "00:00:01,000");
  assert.equal(cues[0].end, "00:00:03,000");
  assert.equal(cues[0].text, "Hello, welcome to this course.");

  // simulate what translateCues returns (Sunbird translated text)
  const translated = cues.map((cue) => ({ ...cue, text: `[LUG] ${cue.text}` }));

  assert.deepEqual(validateCues(translated), { valid: true, errors: [] });

  const output = rebuildSrt(translated);

  // timing preserved
  assert.match(output, /00:00:01,000 --> 00:00:03,000/);
  assert.match(output, /00:00:04,000 --> 00:00:06,000/);
  assert.match(output, /00:00:07,000 --> 00:00:09,500/);

  // translated text present
  assert.match(output, /\[LUG\] Hello, welcome to this course\./);
  assert.match(output, /\[LUG\] Today we will learn about AI\./);
  assert.match(output, /\[LUG\] Let us get started\./);

  // sequence numbers correct
  assert.match(output, /^1\n/);
});

test("pipeline: empty text cues are handled", () => {
  const cues = [
    { sequence: 1, start: "00:00:01,000", end: "00:00:02,000", text: "" },
    { sequence: 2, start: "00:00:03,000", end: "00:00:04,000", text: "Real text" }
  ];

  const output = rebuildSrt(cues);
  assert.match(output, /00:00:01,000 --> 00:00:02,000/);
  assert.match(output, /Real text/);
});

test("pipeline: cue count survives round-trip", () => {
  const cues = parseSrt(SAMPLE_SRT);
  const translated = cues.map((c) => ({ ...c, text: `translated: ${c.text}` }));
  const rebuilt = parseSrt(rebuildSrt(translated));

  assert.equal(rebuilt.length, cues.length);
  rebuilt.forEach((cue, i) => {
    assert.equal(cue.start, cues[i].start);
    assert.equal(cue.end, cues[i].end);
  });
});
