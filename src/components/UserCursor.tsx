import React from "react";
import { MousePointer2 } from "lucide-react";

interface UserCursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

export const UserCursor: React.FC<UserCursorProps> = ({ x, y, color, name }) => {
  return (
    <div
      className="absolute pointer-events-none transition-transform duration-100 ease-out"
      style={{
        left: x,
        top: y,
        transform: "translate(-2px, -2px)"
      }}
    >
      <MousePointer2
        className="w-5 h-5 drop-shadow-lg"
        style={{ color }}
        fill={color}
      />
      <div
        className="mt-1 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};
