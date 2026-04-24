import { useMemo } from "react";

function PixelGrid() {
  const cols = 28;
  const rows = 10;

  const pixels = useMemo(() => {
    const green = ["#00C896", "#00A87A", "#006B4F", "#B8F5E0", "#00E8A8"];
    return Array.from({ length: cols * rows }, (_, i) => ({
      id: i,
      shade: Math.random() > 0.4,
      delay: Math.random() * 1.77,
      color: green[Math.floor(Math.random() * green.length)],
    }));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        opacity: 0.15,
        pointerEvents: "none",
      }}
    >
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          style={{
            background: pixel.shade ? pixel.color : "transparent",
            margin: "1px",
            animation: `pixelBlink ${1.5 + pixel.delay}s ease-in-out infinite`,
            animationDelay: `${pixel.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default PixelGrid;
