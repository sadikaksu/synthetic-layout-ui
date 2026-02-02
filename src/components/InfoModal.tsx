import { useEffect } from "react";

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
};

export const InfoModal = ({ open, onClose }: InfoModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window info-window" onClick={(e) => e.stopPropagation()}>
        <h2 className="info-title">About this project</h2>
        <div className="info-body">
          <p>
            This project was developed as part of a master’s thesis research exploring synthetic data generation for
            architectural layouts.
          </p>
          <p>
            The underlying generator was originally used to produce a large-scale synthetic dataset of one-bedroom
            apartment layouts, designed to support the training of image-based machine learning models.
          </p>
          <p>
            This interface exposes the generator as an interactive, constraint-driven system, allowing exploration,
            inspection, and controlled variation of generated layouts.
          </p>
          <p className="info-link">
            <a href="https://sadikaksu.com/blog/synthetic-layout-generator" target="_blank" rel="noreferrer">
              More details about the project can be found here.
            </a>
          </p>
        </div>
        <div className="info-footer">
          <div>
            <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">
              Creative Commons license (CC-BY-NC).
            </a>
          </div>
          <div>Mehmet Sadık Aksu, 2025.</div>
        </div>
      </div>
    </div>
  );
};
