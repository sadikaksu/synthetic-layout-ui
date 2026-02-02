import type { Constraints, Layout, LayoutMetadata, Room, RoomType } from "./layoutTypes";

const ROOM_ORDER: RoomType[] = ["entrance", "bathroom", "bedroom", "kitchen", "living", "balcony"];

const ROOM_COLORS: Record<RoomType, string> = {
  entrance: "rgb(255, 214, 0)",
  bathroom: "rgb(255, 0, 176)",
  bedroom: "rgb(0, 86, 255)",
  kitchen: "rgb(0, 200, 220)",
  living: "rgb(0, 140, 60)",
  balcony: "rgb(255, 140, 180)",
};

type Rng = {
  random: () => number;
};

const hashSeed = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967296;
  };
};

const createRng = (seed: string): Rng => {
  const next = hashSeed(seed);
  return { random: next };
};

const rnum = (rng: Rng, a: number, b: number) => a + (b - a) * rng.random();
const rint = (rng: Rng, a: number, b: number) => Math.floor(rnum(rng, a, b + 1));
const rchoice = <T>(rng: Rng, list: T[]) => list[rint(rng, 0, list.length - 1)];
const rstep = (rng: Rng, a: number, b: number, step = 10) => Math.floor(rnum(rng, a / step, (b + 1) / step)) * step;

const adjustRange = (min: number, max: number, variety: number): [number, number] => {
  const midpoint = (min + max) * 0.5;
  const halfSpan = (max - min) * 0.5;
  const span = halfSpan * Math.max(0, Math.min(1, variety));
  const low = Math.max(0, midpoint - span);
  const high = midpoint + span;
  return [low, Math.max(high, low)];
};

const resolveDrawOrder = (allowMirror: boolean, rng: Rng): "clockwise" | "counterclockwise" =>
  allowMirror ? rchoice(rng, ["clockwise", "counterclockwise"] as const) : "clockwise";

const resolveRotation = (constraints: Constraints, rng: Rng) =>
  constraints.allowRotation ? rchoice(rng, [0, 90, 180, 270]) : 0;

const cloneConstraints = (constraints: Constraints): Constraints => JSON.parse(JSON.stringify(constraints));

const positionRooms = (rooms: Record<RoomType, Room>, drawOrder: "clockwise" | "counterclockwise", wallThickness: number) => {
  const roomDirectionList: [number, number][] =
    drawOrder === "clockwise"
      ? [
          [-1, 1],
          [-1, -1],
          [1, -1],
          [1, 1],
        ]
      : [
          [1, 1],
          [1, -1],
          [-1, -1],
          [-1, 1],
        ];

  ROOM_ORDER.forEach((type, index) => {
    const activeRoom = rooms[type];
    if (type === "entrance") {
      activeRoom.x = 0;
      activeRoom.y = 0;
      return;
    }
    // living and balcony are positioned as side-effects of kitchen/bedroom; skip their own iteration to avoid invalid vectors
    if (type === "living" || type === "balcony") {
      return;
    }

    const translateVector = roomDirectionList[index - 1];
    const w = activeRoom.w;
    const h = activeRoom.h;
    const entrance = rooms.entrance;
    const delta = { x: 0, y: 0 };

    if (index % 2 !== 0) {
      delta.x = (w + entrance.w) * translateVector[0] * 0.5 + wallThickness * translateVector[0];
      delta.y = (h - entrance.h) * translateVector[1] * 0.5;
    } else {
      delta.x = (w - entrance.w) * translateVector[0] * 0.5;
      delta.y = (h + entrance.h) * translateVector[1] * 0.5 + wallThickness * translateVector[1];
    }

    activeRoom.x = delta.x;
    activeRoom.y = delta.y;

    if (type === "kitchen") {
      const delta2 = { x: 0, y: 0 };
      const living = rooms.living;

      if (index % 2 !== 0) {
        delta2.x = (living.w - w) * translateVector[0] * 0.5;
        delta2.y = (living.h + h) * translateVector[1] * 0.5 + wallThickness * translateVector[1];
      } else {
        delta2.x = (living.w + w) * translateVector[0] * 0.5 + wallThickness * translateVector[0];
        delta2.y = (living.h - h) * translateVector[1] * 0.5;
      }

      living.x = delta.x + delta2.x;
      living.y = delta.y + delta2.y;
    }

    if (type === "bedroom") {
      const delta2 = { x: 0, y: 0 };
      if (index % 2 !== 0) {
        delta2.x = (rooms.balcony.w - rooms.bedroom.w) * translateVector[0] * 0.5;
        delta2.y = (rooms.balcony.h + rooms.bedroom.h) * translateVector[1] * 0.5 + wallThickness * translateVector[1];
      } else {
        delta2.x = (rooms.balcony.w + rooms.bedroom.w) * translateVector[0] * 0.5 + wallThickness * translateVector[0];
        delta2.y = (rooms.balcony.h - rooms.bedroom.h) * translateVector[1] * 0.5;
      }
      rooms.balcony.x = delta.x + delta2.x;
      rooms.balcony.y = delta.y + delta2.y;
    }
  });

  return roomDirectionList;
};

const rotateRooms = (rooms: Record<RoomType, Room>, rotation: number) => {
  if (rotation === 0) return;
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const alignedRotation = rotation % 90 === 0;

  Object.values(rooms).forEach((room) => {
    if (alignedRotation && (rotation === 90 || rotation === 270)) {
      const w = room.w;
      room.w = room.h;
      room.h = w;
    }

    const x = room.x;
    const y = room.y;

    room.x = Math.round((x * cos - y * sin) * 1000) / 1000;
    room.y = Math.round((x * sin + y * cos) * 1000) / 1000;

    if (room.x === 0) room.x = Math.abs(room.x);
    if (room.y === 0) room.y = Math.abs(room.y);
  });
};

export const generateLayout = (constraints: Constraints, seed: string): Layout => {
  const rng = createRng(seed || "0");
  const drawOrder = resolveDrawOrder(constraints.allowMirror, rng);
  const rotation = resolveRotation(constraints, rng);

  const rooms = {} as Record<RoomType, Room>;
  let netArea = 0;

  ROOM_ORDER.forEach((type) => {
    const roomConstraints = constraints.perRoom[type];
    const [minDimension, maxDimension] = adjustRange(
      roomConstraints.minDimension,
      roomConstraints.maxDimension,
      constraints.variety,
    );

    const baseWidth = rstep(rng, minDimension, maxDimension);
    const minHeight = Math.max(roomConstraints.minArea / baseWidth, minDimension);
    const [minH, maxH] = adjustRange(minHeight, maxDimension, constraints.variety);
    const baseHeight = rstep(rng, minH, maxH);
    const area = baseWidth * baseHeight;

    rooms[type] = {
      id: `${type}-${seed}`,
      type,
      x: 0,
      y: 0,
      w: baseWidth,
      h: baseHeight,
      area,
      fill: ROOM_COLORS[type],
    };
    netArea += area;
  });

  const roomDirections = positionRooms(rooms, drawOrder, constraints.wallThickness);
  rotateRooms(rooms, rotation);

  const metrics = {
    netArea,
  };

  const metadata: LayoutMetadata = {
    seed,
    rotation,
    drawOrder,
    wallThickness: constraints.wallThickness,
    roomDirections,
  };

  const constraintsUsed = cloneConstraints(constraints);
  const id = `${seed}-${Math.abs(Math.floor(netArea)).toString(16)}`;

  return {
    id,
    rooms,
    order: ROOM_ORDER,
    metrics,
    constraintsUsed,
    metadata,
  };
};
