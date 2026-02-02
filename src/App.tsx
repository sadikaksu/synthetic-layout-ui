import { useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "./components/Grid";
import { InfoModal } from "./components/InfoModal";
import { LayoutModal } from "./components/LayoutModal";
import { Sidebar } from "./components/Sidebar";
import { LogoMark } from "./components/LogoMark";
import { generateLayout } from "./engine/generateLayout";
import type { Constraints, Layout } from "./engine/layoutTypes";
import "./App.css";
import { createDefaultConstraints, defaultGenerationCount } from "./state/defaults";

const MIN_GENERATION_COUNT = 15;
const MAX_GENERATION_COUNT = 150;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [constraints, setConstraints] = useState<Constraints>(() => createDefaultConstraints());
  const [generationCount, setGenerationCount] = useState(defaultGenerationCount);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldReveal, setShouldReveal] = useState(true);
  const skipFirstConstraintRun = useRef(true);
  const regenerateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRegenerateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationInFlight = useRef(false);
  const pendingGenerate = useRef<{ manual?: boolean } | null>(null);
  const hasShownInitialReveal = useRef(false);
  const [layoutSeeds, setLayoutSeeds] = useState<string[]>([]);
  const prevConstraints = useRef<Constraints | null>(null);

  const selectedLayout = useMemo(() => (selectedIndex !== null ? layouts[selectedIndex] ?? null : null), [layouts, selectedIndex]);

  const getSafeGenerationCount = () => {
    const parsed = Number(generationCount);
    if (!Number.isFinite(parsed)) return defaultGenerationCount;
    const clamped = Math.min(MAX_GENERATION_COUNT, Math.max(MIN_GENERATION_COUNT, Math.floor(parsed)));
    return clamped;
  };

  const handleGenerate = async (options?: { manual?: boolean }) => {
    if (generationInFlight.current) {
      pendingGenerate.current = options ?? { manual: false };
      return;
    }
    generationInFlight.current = true;
    pendingGenerate.current = null;
    const manual = options?.manual ?? false;
    const hardReveal = manual || !hasShownInitialReveal.current;
    setShouldReveal(hardReveal);
    setLayouts([]);
    setSelectedIndex(null);
    setIsModalOpen(false);
    setIsGenerating(manual);
    const count = getSafeGenerationCount();

    const seenSeeds = new Set<string>();
    const seeds: string[] = [];

    const baseSeeds = manual || layoutSeeds.length === 0 ? [] : layoutSeeds.slice(0, count);
    baseSeeds.forEach((s) => {
      seenSeeds.add(s);
      seeds.push(s);
    });

    const nextSeed = () => {
      let token = "";
      do {
        token = Math.random().toString(36).slice(2, 8);
      } while (seenSeeds.has(token));
      seenSeeds.add(token);
      return token;
    };

    while (seeds.length < count) {
      seeds.push(nextSeed());
    }
    setLayoutSeeds(seeds);

    try {
      for (let i = 0; i < seeds.length; i++) {
        const layoutSeed = seeds[i];
        const layout = generateLayout(constraints, layoutSeed);
        setLayouts((prev) => [...prev, layout]);
        if (i === 0) {
          setSelectedIndex(0);
        }
        await sleep(0);
      }
    } finally {
      if (manual) {
        setIsGenerating(false);
      }
      if (!hasShownInitialReveal.current) {
        hasShownInitialReveal.current = true;
      }
      generationInFlight.current = false;
      if (pendingGenerate.current) {
        const next = pendingGenerate.current;
        pendingGenerate.current = null;
        void handleGenerate(next);
      }
    }
  };

  useEffect(() => {
    setShouldReveal(false);
    if (countRegenerateTimer.current) {
      clearTimeout(countRegenerateTimer.current);
    }
    countRegenerateTimer.current = setTimeout(() => {
      void handleGenerate();
    }, 200);
    return () => {
      if (countRegenerateTimer.current) {
        clearTimeout(countRegenerateTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationCount]);

  useEffect(() => {
    if (skipFirstConstraintRun.current) {
      skipFirstConstraintRun.current = false;
      prevConstraints.current = constraints;
      return;
    }
    if (prevConstraints.current === constraints) {
      return;
    }
    prevConstraints.current = constraints;
    setShouldReveal(false);
    if (regenerateTimer.current) {
      clearTimeout(regenerateTimer.current);
    }
    regenerateTimer.current = setTimeout(() => {
      void handleGenerate();
    }, 200);
    return () => {
      if (regenerateTimer.current) {
        clearTimeout(regenerateTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraints]);

  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isInfoOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isInfoOpen]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo" aria-hidden="true">
          <LogoMark />
        </div>
        <div className="topbar-text">
          <h1>Synthetic Layout Generator</h1>
          <p className="subtitle">
            An interactive, constraint-driven system for generating synthetic one-bedroom apartment layouts, designed to
            support dataset creation and model training in architectural AI workflows.
          </p>
        </div>
        <button className="ghost info-button" onClick={() => setIsInfoOpen(true)} aria-label="About this project">
          ⓘ
        </button>
      </header>
      <div className="main">
        <Sidebar
          constraints={constraints}
          onConstraintsChange={setConstraints}
          generationCount={generationCount}
          onGenerationCountChange={setGenerationCount}
          onGenerate={() => {
            void handleGenerate({ manual: true });
          }}
        />
        <Grid
          layouts={layouts}
          selectedIndex={selectedIndex}
          onSelect={(index) => {
            setSelectedIndex(index);
            setIsModalOpen(true);
          }}
          mode={shouldReveal ? "reveal" : "soft"}
        />
      </div>
      <LayoutModal
        open={isModalOpen && selectedLayout !== null}
        layouts={layouts}
        selectedIndex={selectedIndex}
        onClose={() => setIsModalOpen(false)}
        onNavigate={(next) => {
          if (next >= 0 && next < layouts.length) {
            setSelectedIndex(next);
          }
        }}
      />
      <InfoModal open={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}

export default App;
