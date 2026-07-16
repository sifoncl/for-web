// @ts-nocheck Node supplies the test globals; this repository has no unit-test dependency.
import test from "node:test";

import { volumeGainToPercent, volumePercentToGain } from "./volumeCurve.ts";

const close = (actual: number, expected: number) => {
  if (Math.abs(actual - expected) > 0.001)
    throw new Error(`${actual} != ${expected}`);
};

test("keeps the normal volume range linear", () => {
  close(volumePercentToGain(1), 0.01);
  close(volumePercentToGain(50), 0.5);
  close(volumePercentToGain(100), 1);
});

test("provides a strong nonlinear boost above 100 percent", () => {
  close(volumePercentToGain(200), Math.sqrt(10));
  close(volumePercentToGain(300), 10);
});

test("round trips persisted gain values", () => {
  for (const percent of [0, 1, 50, 100, 150, 200, 300]) {
    close(volumeGainToPercent(volumePercentToGain(percent)), percent);
  }
});
