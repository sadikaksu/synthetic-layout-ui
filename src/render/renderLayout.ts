import type { Layout, RoomType } from "../engine/layoutTypes";

interface RenderOptions {
  padding?: number;
  devicePixelRatio?: number;
  showLabels?: boolean;
  hideColors?: boolean;
  showGrid?: boolean;
}

const ROOM_ORDER: RoomType[] = ["entrance", "bathroom", "bedroom", "kitchen", "living", "balcony"];
const WALL_COLOR = "#0b0b0b";
const BG_COLOR = "#ffffff";
const GRID_SPACING_CM = 100;
const GRID_COLOR = "rgba(0, 0, 0, 0.04)";
const GRID_AXIS_COLOR = "rgba(0, 0, 0, 0.06)";
const GRID_LINE_WIDTH_PX = 1;
const PRETTY_ROOM_NAMES: Record<RoomType, string> = {
  entrance: "Entrance",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  living: "Living Room",
  balcony: "Balcony",
};

const computeBounds = (layout: Layout) => {
  const minX: number[] = [];
  const maxX: number[] = [];
  const minY: number[] = [];
  const maxY: number[] = [];
  const wall = layout.metadata.wallThickness;

  Object.values(layout.rooms).forEach((room) => {
    minX.push(room.x - room.w * 0.5 - wall);
    maxX.push(room.x + room.w * 0.5 + wall);
    minY.push(room.y - room.h * 0.5 - wall);
    maxY.push(room.y + room.h * 0.5 + wall);
  });

  const left = Math.min(...minX);
  const right = Math.max(...maxX);
  const top = Math.min(...minY);
  const bottom = Math.max(...maxY);

  return {
    x: (left + right) * 0.5,
    y: (top + bottom) * 0.5,
    w: right - left,
    h: bottom - top,
  };
};

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawRoomLabel = (
  ctx: CanvasRenderingContext2D,
  room: Layout["rooms"][RoomType],
  position: { x: number; y: number; w: number; h: number },
  hideLabelBackground = false
) => {
  const name = PRETTY_ROOM_NAMES[room.type];
  const dims = `${room.w.toFixed(0)}×${room.h.toFixed(0)} cm`;
  const area = `${(room.area / 10000).toFixed(2)} m²`;

  const { x, y, w, h } = position;
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;
  const padding = 6;

  ctx.save();
  ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const measureBlock = (lines: string[]) => {
    const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;
    const fits = boxWidth <= w - padding * 2 && boxHeight <= h - padding * 2;
    return fits ? { boxWidth, boxHeight } : null;
  };

  const fullLines = [name, dims, area];
  const compactLines = [name];

  const fullBlock = measureBlock(fullLines);
  const compactBlock = fullBlock ? null : measureBlock(compactLines);
  const block = fullBlock ?? compactBlock;
  const linesToRender = fullBlock ? fullLines : compactBlock ? compactLines : null;

  if (!block || !linesToRender) {
    ctx.restore();
    return;
  }

  const boxX = x - block.boxWidth / 2;
  const boxY = y - block.boxHeight / 2;

  if (!hideLabelBackground) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    drawRoundedRect(ctx, boxX, boxY, block.boxWidth, block.boxHeight, 6);
    ctx.fill();
  }

  ctx.fillStyle = "#000000";
  const startY = boxY + padding + lineHeight * 0.5;
  linesToRender.forEach((line, idx) => {
    ctx.fillText(line, x, startY + idx * lineHeight);
  });

  ctx.restore();
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  rect: { width: number; height: number },
  translateX: number,
  translateY: number,
  scale: number
) => {
  const spacing = GRID_SPACING_CM;
  const minX = (-translateX) / scale;
  const maxX = (rect.width - translateX) / scale;
  const minY = (-translateY) / scale;
  const maxY = (rect.height - translateY) / scale;

  const startX = Math.floor(minX / spacing - 1) * spacing;
  const endX = Math.ceil(maxX / spacing + 1) * spacing;
  const startY = Math.floor(minY / spacing - 1) * spacing;
  const endY = Math.ceil(maxY / spacing + 1) * spacing;

  ctx.save();
  ctx.lineWidth = GRID_LINE_WIDTH_PX;
  ctx.strokeStyle = GRID_COLOR;

  for (let x = startX; x <= endX; x += spacing) {
    const px = x * scale;
    ctx.beginPath();
    ctx.moveTo(px, minY * scale);
    ctx.lineTo(px, maxY * scale);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += spacing) {
    const py = y * scale;
    ctx.beginPath();
    ctx.moveTo(minX * scale, py);
    ctx.lineTo(maxX * scale, py);
    ctx.stroke();
  }

  if (0 >= startX && 0 <= endX) {
    ctx.strokeStyle = GRID_AXIS_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, minY * scale);
    ctx.lineTo(0, maxY * scale);
    ctx.stroke();
  }

  if (0 >= startY && 0 <= endY) {
    ctx.strokeStyle = GRID_AXIS_COLOR;
    ctx.beginPath();
    ctx.moveTo(minX * scale, 0);
    ctx.lineTo(maxX * scale, 0);
    ctx.stroke();
  }

  ctx.restore();
};

export const renderLayout = (layout: Layout, canvas: HTMLCanvasElement, options?: RenderOptions) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = options?.devicePixelRatio ?? window.devicePixelRatio ?? 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const bounds = computeBounds(layout);
  const padding = options?.padding ?? 16;
  const scale = Math.min((rect.width - padding * 2) / bounds.w, (rect.height - padding * 2) / bounds.h);

  const translateX = rect.width / 2 - bounds.x * scale;
  const translateY = rect.height / 2 - bounds.y * scale;

  ctx.translate(translateX, translateY);

  if (options?.showGrid !== false) {
    drawGrid(ctx, rect, translateX, translateY, scale);
  }

  const wall = layout.metadata.wallThickness * scale;

  ROOM_ORDER.forEach((type) => {
    const room = layout.rooms[type];
    const x = room.x * scale;
    const y = room.y * scale;
    const w = room.w * scale;
    const h = room.h * scale;

    // wall mass
    ctx.fillStyle = WALL_COLOR;
    ctx.beginPath();
    ctx.rect(x - w * 0.5 - wall, y - h * 0.5 - wall, w + wall * 2, h + wall * 2);
    ctx.fill();

    // room interior
    ctx.fillStyle = options?.hideColors ? "#f2f2f2" : room.fill;
    ctx.beginPath();
    ctx.rect(x - w * 0.5, y - h * 0.5, w, h);
    ctx.fill();

    // outline
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w * 0.5, y - h * 0.5, w, h);
  });

  if (options?.showLabels) {
    ROOM_ORDER.forEach((type) => {
      const room = layout.rooms[type];
      const x = room.x * scale;
      const y = room.y * scale;
      const w = room.w * scale;
      const h = room.h * scale;
      drawRoomLabel(ctx, room, { x, y, w, h }, options?.hideColors);
    });
  }

  ctx.restore();
};
