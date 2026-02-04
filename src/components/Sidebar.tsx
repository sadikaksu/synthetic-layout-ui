import { useState } from "react";
import type React from "react";
import type { Constraints, RoomType } from "../engine/layoutTypes";
import { ROOM_TYPES } from "../state/defaults";

type SidebarProps = {
  constraints: Constraints;
  onConstraintsChange: (constraints: Constraints) => void;
  generationCount: number;
  onGenerationCountChange: (count: number) => void;
  onGenerate: () => void;
};

const prettyRoomName: Record<RoomType, string> = {
  entrance: "Entrance",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  living: "Living Room",
  balcony: "Balcony",
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const roundToStep = (value: number, step: number) => Math.round(value / step) * step;
const formatM2 = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : "");

type DraftField = "minDim" | "maxDim" | "minArea";
type DraftsState = Partial<Record<RoomType, Partial<Record<DraftField, string>>>>;

type RoomConstraintUpdate = (room: Constraints["perRoom"][RoomType]) => Constraints["perRoom"][RoomType];

export const Sidebar = ({ constraints, onConstraintsChange, generationCount, onGenerationCountChange, onGenerate }: SidebarProps) => {
  const [drafts, setDrafts] = useState<DraftsState>({});
  const updateConstraint = <K extends keyof Constraints>(key: K, value: Constraints[K]) => {
    onConstraintsChange({ ...constraints, [key]: value });
  };

  const updateRoom = (room: RoomType, updater: RoomConstraintUpdate) => {
    onConstraintsChange({
      ...constraints,
      perRoom: {
        ...constraints.perRoom,
        [room]: updater(constraints.perRoom[room]),
      },
    });
  };

  const setDraft = (room: RoomType, field: DraftField, value?: string) => {
    setDrafts((prev) => ({
      ...prev,
      [room]: {
        ...prev[room],
        [field]: value,
      },
    }));
  };

  const clampRoom = (
    room: RoomType,
    next: {
      minDimension?: number;
      maxDimension?: number;
      minArea?: number;
    },
    changed: "minDimension" | "maxDimension" | "minArea",
  ) => {
    const current = constraints.perRoom[room];
    let minDim = next.minDimension ?? current.minDimension;
    let maxDim = next.maxDimension ?? current.maxDimension;
    let minArea = next.minArea ?? current.minArea;

    minDim = Math.max(100, roundToStep(minDim, 10));
    maxDim = Math.max(100, roundToStep(maxDim, 10));

    if (changed === "minDimension" && minDim > maxDim) {
      maxDim = minDim;
    }
    if (changed === "maxDimension" && maxDim < minDim) {
      maxDim = minDim;
    }

    const minAreaCm2Min = Math.max(10000, minDim * minDim);
    const minAreaCm2Max = Math.max(minAreaCm2Min, maxDim * maxDim);

    minArea = clamp(minArea, minAreaCm2Min, minAreaCm2Max);

    return { minDimension: minDim, maxDimension: maxDim, minArea };
  };

  const commitRoom = (room: RoomType, changed: "minDimension" | "maxDimension" | "minArea", value: number) => {
    const next = clampRoom(room, { [changed]: value }, changed);
    updateRoom(room, () => next);
    setDraft(room, changed === "minDimension" ? "minDim" : changed === "maxDimension" ? "maxDim" : "minArea", undefined);
  };

  const handleBlur = (room: RoomType, field: "minDim" | "maxDim" | "minArea") => {
    const draft = drafts[room]?.[field];
    if (draft === undefined) return;
    if (field === "minArea") {
      const raw = draft.replace(",", ".");
      if (raw.trim() === "") {
        setDraft(room, field, undefined);
        return;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        setDraft(room, field, undefined);
        return;
      }
      commitRoom(room, "minArea", Math.round(parsed * 10000));
    } else {
      if (draft.trim() === "") {
        setDraft(room, field, undefined);
        return;
      }
      const parsed = Number(draft);
      if (!Number.isFinite(parsed)) {
        setDraft(room, field, undefined);
        return;
      }
      commitRoom(room, field === "minDim" ? "minDimension" : "maxDimension", parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, room: RoomType, field: "minDim" | "maxDim" | "minArea") => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setDraft(room, field, undefined);
      e.currentTarget.blur();
    }
  };

  return (
    <aside className="sidebar">
      <div className="section primary">
        <div className="section-header">
          <h3>Generation Properties</h3>
        </div>
        <label className="field">
          <div className="label-row">
            <span>Count</span>
            <span className="value">{generationCount}</span>
          </div>
          <input
            type="range"
            min={15}
            max={150}
            step={1}
            value={generationCount}
            onChange={(e) => {
              const raw = Number(e.target.value);
              if (!Number.isFinite(raw)) return;
              const clamped = Math.min(150, Math.max(15, Math.floor(raw)));
              onGenerationCountChange(clamped);
            }}
          />
        </label>
        <label className="field">
          <div className="label-row">
            <span>Variety</span>
            <span className="value">{constraints.variety.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={constraints.variety}
            onChange={(e) => updateConstraint("variety", Number(e.target.value))}
          />
        </label>
        <label className="field">
          <div className="label-row toggle-row">
            <span>Allow Rotation</span>
            <div className="toggle-right">
              <div className="toggle">
                <input
                  type="checkbox"
                  checked={constraints.allowRotation}
                  onChange={(e) => updateConstraint("allowRotation", e.target.checked)}
                />
                <span className="slider" />
              </div>
            </div>
          </div>
        </label>
        <label className="field">
          <div className="label-row toggle-row">
            <span>Allow Mirror</span>
            <div className="toggle-right">
              <div className="toggle">
                <input
                  type="checkbox"
                  checked={constraints.allowMirror}
                  onChange={(e) => updateConstraint("allowMirror", e.target.checked)}
                />
                <span className="slider" />
              </div>
            </div>
          </div>
        </label>
        <button className="primary generate-button-full" onClick={onGenerate}>
          Generate
        </button>
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Layout Properties</h3>
        </div>
        <label className="field">
          <div className="label-row">
            <span>Wall Thickness</span>
            <span className="value">{constraints.wallThickness} cm</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={constraints.wallThickness}
            onChange={(e) => updateConstraint("wallThickness", Number(e.target.value))}
          />
        </label>
        <div className="section-divider" />
        <div className="per-room">
          <div className="per-room-header">
            <span className="layout-subtitle">Room Constraints</span>
          </div>
          {ROOM_TYPES.map((room) => (
            <div className="per-room-row" key={room}>
              {(() => {
                const current = constraints.perRoom[room];
                const minDim = current.minDimension;
                const maxDim = current.maxDimension;
                const minAreaM2 = current.minArea / 10000;
                const minAreaMin = Math.max(1, (minDim * minDim) / 10000);
                const minAreaMax = Math.max(minAreaMin, (maxDim * maxDim) / 10000);

                const displayArea = drafts[room]?.minArea ?? formatM2(minAreaM2);
                const displayMinDim = drafts[room]?.minDim ?? minDim.toString();
                const displayMaxDim = drafts[room]?.maxDim ?? maxDim.toString();

                return (
                  <>
                    <div className="room-name">{prettyRoomName[room]}</div>
                    <div className="per-room-grid two">
                      <label>
                        <span className="field-label">Min Dim</span>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={100}
                            max={maxDim}
                            step={10}
                            value={displayMinDim}
                            onChange={(e) => setDraft(room, "minDim", e.target.value)}
                            onBlur={() => handleBlur(room, "minDim")}
                            onFocus={() => setDraft(room, "minDim", minDim.toString())}
                            onKeyDown={(e) => handleKeyDown(e, room, "minDim")}
                          />
                          <span className="unit">cm</span>
                        </div>
                      </label>
                      <label>
                        <span className="field-label">Max Dim</span>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={minDim}
                            max={1200}
                            step={10}
                            value={displayMaxDim}
                            onChange={(e) => setDraft(room, "maxDim", e.target.value)}
                            onBlur={() => handleBlur(room, "maxDim")}
                            onFocus={() => setDraft(room, "maxDim", maxDim.toString())}
                            onKeyDown={(e) => handleKeyDown(e, room, "maxDim")}
                          />
                          <span className="unit">cm</span>
                        </div>
                      </label>
                    </div>
                    <div className="per-room-grid single">
                      <label>
                        <span className="field-label">Min Area</span>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            inputMode="decimal"
                            lang="en"
                            step={0.1}
                            min={minAreaMin}
                            max={minAreaMax}
                            value={displayArea}
                            onChange={(e) => setDraft(room, "minArea", e.target.value)}
                            onBlur={() => handleBlur(room, "minArea")}
                            onFocus={() => setDraft(room, "minArea", formatM2(minAreaM2))}
                            onKeyDown={(e) => handleKeyDown(e, room, "minArea")}
                          />
                          <span className="unit">m²</span>
                        </div>
                      </label>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
