export type RoomType = "entrance" | "bathroom" | "bedroom" | "kitchen" | "living" | "balcony";

export interface RoomConstraints {
  minDimension: number;
  maxDimension: number;
  minArea: number;
}

export interface Constraints {
  variety: number; // 0-1 range controlling randomness span
  allowRotation: boolean;
  allowMirror: boolean;
  wallThickness: number;
  perRoom: Record<RoomType, RoomConstraints>;
}

export interface Room {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
  fill: string;
}

export interface Metrics {
  netArea: number;
}

export interface LayoutMetadata {
  seed: string;
  rotation: number;
  drawOrder: "clockwise" | "counterclockwise";
  wallThickness: number;
  roomDirections: [number, number][];
}

export interface Layout {
  id: string;
  rooms: Record<RoomType, Room>;
  order: RoomType[];
  metrics: Metrics;
  constraintsUsed: Constraints;
  metadata: LayoutMetadata;
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  constraints: Constraints;
}
