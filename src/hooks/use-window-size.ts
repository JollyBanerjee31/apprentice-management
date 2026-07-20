"use client";

import { useEffect, useState } from "react";

interface WindowSize {
  width: number;
  height: number;
}

// A minimal stand-in for react-use's useWindowSize — pulling in a 40+ hook
// utility library for one hook wasn't worth the dependency.
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}
