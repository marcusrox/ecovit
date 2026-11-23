import { expect, it } from "vitest";
import {
  DRAWING_FONT_FAMILY,
  labelFont,
  labelFontSize,
  labelSpacing,
  LABEL_REFERENCE_SCALE,
} from "../src/editor/label-font";
import { MIN_CAMERA_SCALE } from "../src/editor/useProjectCamera";

it("T-034 preserves category sizes at the reference and scales linearly without caps", () => {
  for (const base of [11, 12, 13]) {
    expect(labelFontSize(base, LABEL_REFERENCE_SCALE)).toBeCloseTo(base);
    for (const scale of [MIN_CAMERA_SCALE, 0.003, 0.012, 0.018, 0.12]) {
      const size = labelFontSize(base, scale);
      expect(size / scale).toBeCloseTo(base / LABEL_REFERENCE_SCALE);
      expect(labelFontSize(base, scale * 2)).toBeCloseTo(size * 2);
      expect(labelSpacing(18, scale) / size).toBeCloseTo(18 / base);
    }
    expect(labelFontSize(base, MIN_CAMERA_SCALE)).toBeLessThan(1);
    expect(labelFontSize(base, 0.12)).toBeGreaterThan(100);
  }
});
it("T-034 uses the local font with category weight and unrounded camera scale", () => {
  expect(DRAWING_FONT_FAMILY).toBe("IBM Plex Sans");
  expect(labelFont(13, LABEL_REFERENCE_SCALE)).toBe('400 13px "IBM Plex Sans"');
  expect(labelFont(12, LABEL_REFERENCE_SCALE, 600)).toBe(
    '600 12px "IBM Plex Sans"',
  );
  const scale = 0.007321;
  expect(labelFontSize(11, scale)).not.toBe(labelFontSize(11, 0.00732));
});
it("T-034 scales compass lettering once and preserves its proportion to the symbol", () => {
  for (const worldSize of [1000, 10000, 50000])
    for (const scale of [MIN_CAMERA_SCALE, LABEL_REFERENCE_SCALE, 0.12])
      expect(
        labelFontSize(worldSize * LABEL_REFERENCE_SCALE * 0.14, scale),
      ).toBeCloseTo(worldSize * scale * 0.14);
});
