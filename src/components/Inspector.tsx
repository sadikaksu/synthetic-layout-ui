import { useEffect, useRef } from "react";
import type { Layout } from "../engine/layoutTypes";
import { renderLayout } from "../render/renderLayout";

type InspectorProps = {
  layout: Layout | null;
};

export const Inspector = ({ layout }: InspectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!layout || !canvasRef.current) return;
    renderLayout(layout, canvasRef.current, { padding: 24 });
  }, [layout]);

  if (!layout) {
    return (
      <aside className="inspector empty">
        <p>Select a layout to inspect.</p>
      </aside>
    );
  }

  const exportPng = () => {
    if (!canvasRef.current) return;
    renderLayout(layout, canvasRef.current, { padding: 24, showGrid: false });
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `layout-${layout.id}.png`;
    link.click();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `layout-${layout.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div>
          <div className="label">Seed</div>
          <div className="value">{layout.metadata.seed}</div>
        </div>
        <div className="actions">
          <button onClick={exportPng}>Export PNG</button>
          <button onClick={exportJson}>Export JSON</button>
        </div>
      </div>

      <div className="inspector-canvas">
        <canvas ref={canvasRef} />
      </div>

      <div className="inspector-metrics">
        <div>
          <div className="label">Net Area</div>
          <div className="value">{(layout.metrics.netArea / 10000).toFixed(2)} m²</div>
        </div>
        <div>
          <div className="label">Rotation</div>
          <div className="value">{layout.metadata.rotation.toFixed(1)}°</div>
        </div>
        <div>
          <div className="label">Draw Order</div>
          <div className="value">{layout.metadata.drawOrder}</div>
        </div>
      </div>

      <div className="inspector-rooms">
        <div className="rooms-header">
          <span>Rooms</span>
          <span className="hint">area · w × h</span>
        </div>
        {layout.order.map((roomKey) => {
          const room = layout.rooms[roomKey];
          return (
            <div className="room-row" key={roomKey}>
              <div className="room-name">{room.type}</div>
              <div className="room-meta">
                <span>{(room.area / 10000).toFixed(2)} m²</span>
                <span>
                  {room.w.toFixed(0)} × {room.h.toFixed(0)}
                </span>
                <span>
                  ({room.x.toFixed(0)}, {room.y.toFixed(0)})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
