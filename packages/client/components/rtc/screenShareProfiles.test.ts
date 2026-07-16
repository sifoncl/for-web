// @ts-nocheck Deno supplies the test globals; this repository intentionally has no unit-test dependency.
import test from "node:test";
import {
  buildScreenShareProfile,
  getEnabledScreenShareResolutions,
  migrateScreenShareQuality,
} from "./screenShareProfiles.ts";

const equal = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
};

test("filters resolutions using zero as an unlimited axis", () => {
  equal(
    getEnabledScreenShareResolutions([1920, 1080]).map((item) => item.id),
    ["720p", "1080p", "source"],
  );
  equal(
    getEnabledScreenShareResolutions([0, 2160]).map((item) => item.id),
    ["720p", "1080p", "4k", "source"],
  );
});

test("migrates legacy quality values", () => {
  equal(migrateScreenShareQuality("low"), {
    resolutionId: "720p",
    frameRate: 30,
  });
  equal(migrateScreenShareQuality("high"), {
    resolutionId: "1080p",
    frameRate: 30,
  });
  equal(migrateScreenShareQuality("text"), {
    resolutionId: "source",
    frameRate: 5,
  });
});

test("builds all required capture profiles", () => {
  for (const resolutionId of ["720p", "1080p", "4k"] as const) {
    for (const frameRate of [30, 60] as const) {
      const profile = buildScreenShareProfile({ resolutionId, frameRate });
      equal(profile.capture.frameRate, { max: frameRate });
    }
  }
  equal(
    buildScreenShareProfile(
      { resolutionId: "source", frameRate: 5 },
      [1920, 1080],
    ).capture,
    { width: { max: 1920 }, height: { max: 1080 }, frameRate: { max: 5 } },
  );
  for (const frameRate of [30, 60] as const) {
    const source = buildScreenShareProfile(
      { resolutionId: "source", frameRate },
      [3840, 2160],
    );
    equal(source.capture, {
      width: { max: 3840 },
      height: { max: 2160 },
      frameRate: { max: frameRate },
    });
    equal(source.contentHint, "motion");
  }
});
