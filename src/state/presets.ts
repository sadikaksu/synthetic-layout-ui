import type { Preset } from "../engine/layoutTypes";
import { createDefaultConstraints } from "./defaults";

const withName = (id: string, name: string, mutate: (c: ReturnType<typeof createDefaultConstraints>) => void): Preset => {
  const constraints = createDefaultConstraints();
  mutate(constraints);
  return { id, name, constraints };
};

export const presets: Preset[] = [
  withName("baseline", "Baseline", () => {}),
  withName("compact", "Compact Grid", (c) => {
    c.variety = 0.25;
    c.allowRotation = false;
    c.allowMirror = false;
    c.wallThickness = 16;
  }),
  withName("rotated", "Rotated Courtyard", (c) => {
    c.variety = 0.7;
    c.allowRotation = true;
    c.allowMirror = false;
  }),
  withName("open-living", "Open Living", (c) => {
    c.variety = 0.85;
    c.allowRotation = true;
    c.allowMirror = true;
    c.perRoom.living.maxDimension = 750;
    c.perRoom.living.minArea = 150000;
    c.wallThickness = 18;
  }),
  withName("balcony-forward", "Balcony Forward", (c) => {
    c.variety = 0.55;
    c.allowRotation = true;
    c.allowMirror = true;
    c.perRoom.balcony.minDimension = 180;
    c.perRoom.balcony.maxDimension = 340;
    c.perRoom.balcony.minArea = 70000;
  }),
];
