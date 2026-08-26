import { useState, useEffect, useRef } from "react";
import {
  Construction,
  TreePine,
  Lightbulb,
  ShieldCheck,
  FileText,
  Droplets,
  Bus,
  Heart,
} from "lucide-react";

const ICONS = [
  { icon: Construction, color: "#e67e22" },
  { icon: TreePine,     color: "#27ae60" },
  { icon: Lightbulb,    color: "#f1c40f" },
  { icon: ShieldCheck,  color: "#0F2C59" },
  { icon: FileText,     color: "#8e44ad" },
  { icon: Droplets,     color: "#3498db" },
  { icon: Bus,          color: "#e74c3c" },
  { icon: Heart,        color: "#D63031" },
];
const CYCLE_MS = 1500;

function SmallSpinner({ className = "" }) {
  return (
    <div
      className={`h-4 w-4 rounded-full border-2 border-neutral-200 border-t-[#D63031] animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export default function Spinner({ size = "md", className = "" }) {
  const [iconIndex, setIconIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const firstSwap = setTimeout(() => {
      setIconIndex((prev) => {
        let next;
        do { next = Math.floor(Math.random() * ICONS.length); } while (next === prev);
        return next;
      });
      intervalRef.current = setInterval(() => {
        setIconIndex((prev) => {
          let next;
          do { next = Math.floor(Math.random() * ICONS.length); } while (next === prev);
          return next;
        });
      }, CYCLE_MS);
    }, CYCLE_MS * 0.5);

    return () => {
      clearTimeout(firstSwap);
      clearInterval(intervalRef.current);
    };
  }, []);

  if (size === "sm") {
    return <SmallSpinner className={className} />;
  }

  const { icon: Icon, color } = ICONS[iconIndex];
  const iconPx = size === "lg" ? 26 : 20;
  const boxPx = size === "lg" ? 52 : 40;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <div
        className="flex items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200/80"
        style={{
          width: boxPx,
          height: boxPx,
          color,
          transition: "color 0.4s ease",
          animation: `iconWheel ${CYCLE_MS}ms ease-in-out infinite`,
        }}
      >
        <Icon
          width={iconPx}
          height={iconPx}
          strokeWidth={1.5}
        />
      </div>

      <p className="text-[13px] text-neutral-400 font-medium">Cargando...</p>

      <style>{`
        @keyframes iconWheel {
          0%, 20%   { transform: rotate(0deg); }
          80%, 100% { transform: rotate(720deg); }
        }
      `}</style>
    </div>
  );
}
