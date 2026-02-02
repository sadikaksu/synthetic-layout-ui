import { useEffect, useRef } from "react";
import type { Layout } from "../engine/layoutTypes";
import { renderLayout } from "../render/renderLayout";

type ThumbnailCardProps = {
  layout: Layout;
  selected: boolean;
  onSelect: () => void;
  index?: number;
  mode?: "reveal" | "soft";
};

export const ThumbnailCard = ({ layout, selected, onSelect, index = 0, mode = "soft" }: ThumbnailCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const THUMBNAIL_INNER_PADDING_PX = 18;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const resize = () => {
      const box = containerRef.current;
      const canvas = canvasRef.current;
      if (!box || !canvas) return;
      const size = Math.min(box.clientWidth, box.clientHeight);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      renderLayout(layout, canvas, { padding: THUMBNAIL_INNER_PADDING_PX, devicePixelRatio: dpr });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();

    return () => observer.disconnect();
  }, [layout]);

  return (
    <button
      className={`thumbnail thumbnail--${mode} ${selected ? "selected" : ""}`}
      onClick={onSelect}
      style={mode === "reveal" ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      <div className="thumb-canvas" ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    </button>
  );
};
