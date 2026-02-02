import { useEffect, useRef } from "react";
import type { Layout } from "../engine/layoutTypes";
import { renderLayout } from "../render/renderLayout";

type LayoutPreviewProps = {
  layout: Layout;
  padding?: number;
  className?: string;
  showLabels?: boolean;
  hideColors?: boolean;
};

export const LayoutPreview = ({ layout, padding = 24, className, showLabels = false, hideColors = false }: LayoutPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!layout || !canvasRef.current || !containerRef.current) return;

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
      renderLayout(layout, canvas, { padding, devicePixelRatio: dpr, showLabels, hideColors });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();

    return () => observer.disconnect();
  }, [layout, padding, showLabels, hideColors]);

  return (
    <div className={`layout-preview ${className ?? ""}`} ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
};
