export type ScreenShareResolutionId = "720p" | "1080p" | "4k" | "source";
export type ScreenShareFrameRate = 5 | 30 | 60;
export type LegacyScreenShareQualityName = "low" | "high" | "text";

export type ScreenShareSelection = {
  resolutionId: ScreenShareResolutionId;
  frameRate: ScreenShareFrameRate;
};

export type ScreenShareResolution = {
  id: ScreenShareResolutionId;
  width: number;
  height: number;
};

export const SCREEN_SHARE_RESOLUTIONS: readonly ScreenShareResolution[] = [
  { id: "720p", width: 1280, height: 720 },
  { id: "1080p", width: 1920, height: 1080 },
  { id: "4k", width: 3840, height: 2160 },
  { id: "source", width: 0, height: 0 },
];

export const SCREEN_SHARE_FRAME_RATES: readonly ScreenShareFrameRate[] = [
  5, 30, 60,
];

export function migrateScreenShareQuality(
  quality?: LegacyScreenShareQualityName,
): ScreenShareSelection {
  if (quality === "high") return { resolutionId: "1080p", frameRate: 30 };
  if (quality === "text") return { resolutionId: "source", frameRate: 5 };
  return { resolutionId: "720p", frameRate: 30 };
}

export function getEnabledScreenShareResolutions(
  limit?: readonly [number, number],
) {
  const allowed = (resolution: ScreenShareResolution) =>
    !limit ||
    ((limit[0] === 0 || limit[0] >= resolution.width) &&
      (limit[1] === 0 || limit[1] >= resolution.height));
  const fixed = SCREEN_SHARE_RESOLUTIONS.filter(
    (resolution) => resolution.id !== "source" && allowed(resolution),
  );
  // Source is capped by the capture constraints below, so it cannot bypass a server limit.
  return [...fixed, SCREEN_SHARE_RESOLUTIONS[3]];
}

export function normaliseScreenShareSelection(
  selection: ScreenShareSelection,
  limit?: readonly [number, number],
): ScreenShareSelection {
  const enabled = getEnabledScreenShareResolutions(limit);
  const resolutionId = enabled.some(
    (item) => item.id === selection.resolutionId,
  )
    ? selection.resolutionId
    : enabled.filter((item) => item.id !== "source").at(-1)?.id || "source";
  let frameRate = selection.frameRate;
  if (!SCREEN_SHARE_FRAME_RATES.includes(frameRate)) frameRate = 30;
  return { resolutionId, frameRate };
}

export function buildScreenShareProfile(
  selection: ScreenShareSelection,
  limit?: readonly [number, number],
) {
  const safe = normaliseScreenShareSelection(selection, limit);
  const resolution = SCREEN_SHARE_RESOLUTIONS.find(
    (item) => item.id === safe.resolutionId,
  )!;
  const sourceWidth = limit?.[0] || undefined;
  const sourceHeight = limit?.[1] || undefined;
  const width = safe.resolutionId === "source" ? sourceWidth : resolution.width;
  const height =
    safe.resolutionId === "source" ? sourceHeight : resolution.height;
  const bitrate: Partial<Record<string, number>> = {
    "720p-60": 6_000_000,
    "1080p-60": 12_000_000,
    "4k-30": 18_000_000,
    "4k-60": 25_000_000,
  };
  return {
    selection: safe,
    capture: {
      width: width ? { max: width } : undefined,
      height: height ? { max: height } : undefined,
      frameRate: { max: safe.frameRate },
    },
    contentHint:
      safe.resolutionId === "source" && safe.frameRate === 5
        ? "text"
        : "motion",
    encoding: {
      maxFramerate: safe.frameRate,
      maxBitrate: bitrate[`${safe.resolutionId}-${safe.frameRate}`],
    },
  };
}
