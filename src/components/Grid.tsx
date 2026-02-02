import type { Layout } from "../engine/layoutTypes";
import { ThumbnailCard } from "./ThumbnailCard";

type GridProps = {
  layouts: Layout[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  mode?: "reveal" | "soft";
};

export const Grid = ({ layouts, selectedIndex, onSelect, mode = "soft" }: GridProps) => {
  const gridClass = `grid ${mode === "reveal" ? "grid--reveal" : "grid--soft"}`;
  return (
    <section className={gridClass}>
      <div className="grid-inner">
        {layouts.map((layout, index) => (
          <ThumbnailCard
            key={layout.id}
            layout={layout}
            selected={index === selectedIndex}
            onSelect={() => onSelect(index)}
            index={index}
            mode={mode}
          />
        ))}
      </div>
    </section>
  );
};
