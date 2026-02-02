import { useEffect, useState } from "react";
import type { Layout } from "../engine/layoutTypes";
import { LayoutPreview } from "./LayoutPreview";

type LayoutModalProps = {
  open: boolean;
  layouts: Layout[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

const ROOM_LABELS: Record<Layout["order"][number], string> = {
  entrance: "Entrance",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  living: "Living Room",
  balcony: "Balcony",
};

const DRAW_ORDER_LABELS: Record<Layout["metadata"]["drawOrder"], string> = {
  clockwise: "Clockwise",
  counterclockwise: "Counter Clockwise",
};

export const LayoutModal = ({ open, layouts, selectedIndex, onClose, onNavigate }: LayoutModalProps) => {
  const layout = selectedIndex !== null ? layouts[selectedIndex] : null;
  const [hideLabels, setHideLabels] = useState(false);
  const [hideColors, setHideColors] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && selectedIndex !== null && selectedIndex > 0) {
        onNavigate(selectedIndex - 1);
      } else if (e.key === "ArrowRight" && selectedIndex !== null && selectedIndex < layouts.length - 1) {
        onNavigate(selectedIndex + 1);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, onNavigate, selectedIndex, layouts.length]);

  if (!open || !layout || selectedIndex === null) return null;

  const prevDisabled = selectedIndex <= 0;
  const nextDisabled = selectedIndex >= layouts.length - 1;
  const rotationDisplay = parseFloat(layout.metadata.rotation.toFixed(1)).toString() + "°";

  const exportPng = () => {
    const previewCanvas = document.querySelector(".layout-preview.modal-preview canvas") as HTMLCanvasElement | null;
    if (previewCanvas) {
      const url = previewCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `layout-${layout.id}.png`;
      link.click();
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body two-col">
          <div className="modal-left">
            <div className="modal-left-inner">
              <div className="preview-square">
                <LayoutPreview
                  layout={layout}
                  padding={32}
                  showLabels={!hideLabels}
                  hideColors={hideColors}
                  className="modal-preview"
                />
                <div className="preview-nav">
                  <button onClick={() => onNavigate(selectedIndex - 1)} disabled={prevDisabled} aria-label="Previous layout">
                    ←
                  </button>
                  <button onClick={() => onNavigate(selectedIndex + 1)} disabled={nextDisabled} aria-label="Next layout">
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-right right-col">
            <div className="rooms-table">
              <div className="rooms-table-header">
                <div>Room</div>
                <div className="num">Area (m²)</div>
                <div className="num">Dimensions (cm)</div>
                <div>Coordinates</div>
              </div>
              <div className="rooms-table-body scrollable">
                {layout.order.map((roomKey, idx) => {
                  const room = layout.rooms[roomKey];
                  return (
                    <div className={`rooms-table-row ${idx % 2 === 1 ? "alt" : ""}`} key={roomKey}>
                      <div>{ROOM_LABELS[roomKey]}</div>
                      <div className="num">{(room.area / 10000).toFixed(2)}</div>
                      <div className="num">
                        {room.w.toFixed(0)} × {room.h.toFixed(0)}
                      </div>
                      <div>
                        ({room.x.toFixed(0)}, {room.y.toFixed(0)})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="facts-row">
              <div>
                <div className="table-header-text factLabel">Seed</div>
                <div className="table-cell-text factValue">{layout.metadata.seed}</div>
              </div>
              <div>
                <div className="table-header-text factLabel">Total Net Area</div>
                <div className="table-cell-text factValue">{(layout.metrics.netArea / 10000).toFixed(2)} m²</div>
              </div>
              <div>
                <div className="table-header-text factLabel">Rotation</div>
                <div className="table-cell-text factValue">{rotationDisplay}</div>
              </div>
              <div>
                <div className="table-header-text factLabel">Draw Order</div>
                <div className="table-cell-text factValue">{DRAW_ORDER_LABELS[layout.metadata.drawOrder]}</div>
              </div>
            </div>

            <div className="detail-toggles">
              <label className="toggle-line">
                <span>Hide Labels</span>
                <div className="toggle">
                  <input type="checkbox" checked={hideLabels} onChange={(e) => setHideLabels(e.target.checked)} />
                  <span className="slider" />
                </div>
              </label>
              <label className="toggle-line">
                <span>Hide Colors</span>
                <div className="toggle">
                  <input type="checkbox" checked={hideColors} onChange={(e) => setHideColors(e.target.checked)} />
                  <span className="slider" />
                </div>
              </label>
            </div>

            <div className="export-buttons">
              <button onClick={exportPng}>Export PNG</button>
              <button onClick={exportJson}>Export JSON</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
