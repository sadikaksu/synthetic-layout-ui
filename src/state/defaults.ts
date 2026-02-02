import type { Constraints, RoomType } from "../engine/layoutTypes";

export const ROOM_TYPES: RoomType[] = ["entrance", "bathroom", "bedroom", "kitchen", "living", "balcony"];

export const regulationDefaults = {
  minSide: { entrance: 120, kitchen: 150, bedroom: 250, bathroom: 150, living: 300, balcony: 140 },
  maxSide: { entrance: 400, kitchen: 400, bedroom: 600, bathroom: 400, living: 700, balcony: 300 },
  minArea: { entrance: 14400, kitchen: 33000, bedroom: 90000, bathroom: 40000, living: 120000, balcony: 60000 },
};

export const createDefaultConstraints = (): Constraints => ({
  variety: 0.6,
  allowRotation: true,
  allowMirror: true,
  wallThickness: 20,
  perRoom: {
    entrance: {
      minDimension: regulationDefaults.minSide.entrance,
      maxDimension: regulationDefaults.maxSide.entrance,
      minArea: regulationDefaults.minArea.entrance,
    },
    bathroom: {
      minDimension: regulationDefaults.minSide.bathroom,
      maxDimension: regulationDefaults.maxSide.bathroom,
      minArea: regulationDefaults.minArea.bathroom,
    },
    bedroom: {
      minDimension: regulationDefaults.minSide.bedroom,
      maxDimension: regulationDefaults.maxSide.bedroom,
      minArea: regulationDefaults.minArea.bedroom,
    },
    kitchen: {
      minDimension: regulationDefaults.minSide.kitchen,
      maxDimension: regulationDefaults.maxSide.kitchen,
      minArea: regulationDefaults.minArea.kitchen,
    },
    living: {
      minDimension: regulationDefaults.minSide.living,
      maxDimension: regulationDefaults.maxSide.living,
      minArea: regulationDefaults.minArea.living,
    },
    balcony: {
      minDimension: regulationDefaults.minSide.balcony,
      maxDimension: regulationDefaults.maxSide.balcony,
      minArea: regulationDefaults.minArea.balcony,
    },
  },
});

export const defaultSeed = "1001";
export const defaultGenerationCount = 15;
