import { useState, useEffect, useRef } from "react";

export function useContainerSize(): [
  React.RefObject<HTMLDivElement | null>,
  { width: number; height: number },
] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const update = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
