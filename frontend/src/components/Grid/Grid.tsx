import { useEffect, useRef, useState } from "react";
import panzoom from "panzoom";
import InfoModal from "./InfoModal";
import { useWebSocket } from "../../context/useWebSocket";

const GRID_COLUMNS = 50;
const GRID_ROWS = 30;
const GRID_SIZE = 300;

const Grid = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { grids } = useWebSocket();

  useEffect(() => {
    if (!gridRef.current || !wrapperRef.current) return;

    const scale = 0.2;
    const pan = panzoom(gridRef.current, {
      minZoom: 0.1,
      maxZoom: 3,
      bounds: false,
    });

    const gridWidth = GRID_COLUMNS * GRID_SIZE * scale;
    const gridHeight = GRID_ROWS * GRID_SIZE * scale;
    const offsetX = (window.innerWidth - gridWidth) / 2;
    const offsetY = (window.innerHeight - gridHeight) / 2;
    pan.zoomAbs(offsetX, offsetY, scale);

    const updateBackgroundAndClamp = () => {
      const { x, y, scale } = pan.getTransform();
      const gridWidth = GRID_COLUMNS * GRID_SIZE * scale;
      const gridHeight = GRID_ROWS * GRID_SIZE * scale;

      const minX = -gridWidth;
      const maxX = window.innerWidth;
      const minY = -gridHeight;
      const maxY = window.innerHeight;

      const clampedX = Math.min(maxX, Math.max(minX, x));
      const clampedY = Math.min(maxY, Math.max(minY, y));

      if (x !== clampedX || y !== clampedY) {
        requestAnimationFrame(() => {
          pan.moveTo(clampedX, clampedY);
        });
      }

      wrapperRef.current!.style.backgroundSize = `${GRID_SIZE * scale}px ${
        GRID_SIZE * scale
      }px`;
      wrapperRef.current!.style.backgroundPosition = `${clampedX}px ${clampedY}px`;
    };

    pan.on("transform", updateBackgroundAndClamp);
    updateBackgroundAndClamp();

    return () => pan.dispose();
  }, []);

  return (
    <>
      {selectedIndex != null && (
        <InfoModal gridData={grids[selectedIndex]!}/>
      )}
      <div
        ref={wrapperRef}
        className="w-screen h-screen overflow-hidden bg-[#121212]"
        style={{
          backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
          backgroundSize: `${GRID_SIZE * 0.2}px ${GRID_SIZE * 0.2}px`,
          backgroundPosition: `0px 0px`,
        }}
      >
        <div
          ref={gridRef}
          className="grid origin-top-left"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${GRID_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_SIZE}px)`,
            width: "max-content",
            height: "max-content",
          }}
        >
          {grids.map((grid, i) => {
            const isSelected = selectedIndex === i;
            const isOwned = grid?.isOwned;

            return (
              <div
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`w-[300px] h-[300px] box-border cursor-pointer ${
                  isOwned
                    ? "bg-[#1c1c1c] border border-[#2a2a2a]"
                    : `bg-[#181818] border border-[#2a2a2a] ${
                        isSelected
                          ? ""
                          : "hover:border-[#494949] hover:border-2 hover:bg-[#252525]"
                      }`
                } ${isSelected ? "border-8 border-[#8b5cf6]" : ""}`}
              >
                {isOwned && grid.nftImageFromMOS && grid?.nftImage !== "unknown" && (
                  <img
                    src={grid.nftImageFromMOS}
                    alt="nft"
                    className="w-full h-full object-cover"
                    onError={() => console.warn("Image failed", grid.nftImageFromMOS)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Grid;
