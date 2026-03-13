import { useState, useEffect, useRef } from "react";

/** コンテナ要素のサイズをリアルタイムで取得するフック（グリーン描画領域のサイズ計算に使用） */
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
    // ResizeObserver: 要素のサイズ変更を検知するブラウザAPI
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
