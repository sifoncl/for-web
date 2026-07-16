const MAX_VOLUME_PERCENT = 300;

/** Convert the UI percentage to an audio gain with stronger boost above 100%. */
export function volumePercentToGain(percent: number) {
  const safePercent = Math.min(MAX_VOLUME_PERCENT, Math.max(0, percent));
  if (safePercent <= 100) return safePercent / 100;
  return 10 ** ((safePercent - 100) / 200);
}

/** Convert a persisted audio gain back to the UI percentage. */
export function volumeGainToPercent(gain: number) {
  if (gain <= 1) return Math.round(Math.max(0, gain) * 100);
  return Math.round(100 + 200 * Math.log10(gain));
}
