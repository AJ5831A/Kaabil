import { describe, expect, it } from "vitest";
import { isWav, pcmToWav, rateFromMime } from "../wav";

describe("wav", () => {
  it("wraps PCM with a valid header", () => {
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const wav = pcmToWav(pcm, 24000);
    expect(wav.length).toBe(48);
    expect(isWav(wav)).toBe(true);
    const v = new DataView(wav.buffer);
    expect(v.getUint32(24, true)).toBe(24000);
    expect(v.getUint32(40, true)).toBe(4);
    expect(isWav(pcm)).toBe(false);
  });
  it("reads sample rate from mime", () => {
    expect(rateFromMime("audio/L16;codec=pcm;rate=16000")).toBe(16000);
    expect(rateFromMime(undefined)).toBe(24000);
  });
});
