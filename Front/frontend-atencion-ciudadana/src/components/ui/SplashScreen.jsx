import { useState, useEffect } from "react";
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

const ICONS = [Construction, TreePine, Lightbulb, ShieldCheck, FileText, Droplets, Bus, Heart];
const COLORS = ["#D63031", "#0F2C59", "#D63031", "#0F2C59", "#D63031", "#0F2C59", "#D63031", "#0F2C59"];

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [activeIcon, setActiveIcon] = useState(0);

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setActiveIcon((prev) => (prev + 1) % ICONS.length);
    }, 280);
    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    const doneTimer = setTimeout(() => onFinish(), 2300);
    return () => {
      clearInterval(iconInterval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const ActiveIcon = ICONS[activeIcon];
  const activeColor = COLORS[activeIcon];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0F2C59] to-[#D63031]"
          style={{ animation: "splashBar 2s ease-out both" }}
        />
      </div>

      {/* Rotating icon */}
      <div className="relative mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: `${activeColor}08`,
            border: `1.5px solid ${activeColor}15`,
            animation: "splashIconPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            key: activeIcon,
          }}
        >
          <ActiveIcon
            key={activeIcon}
            className="w-7 h-7"
            strokeWidth={1.5}
            style={{
              color: activeColor,
              animation: "splashIconPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          />
        </div>

        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1.5px solid ${activeColor}`,
            opacity: 0.15,
            animation: "splashRing 0.28s ease-out both",
          }}
        />
      </div>

      {/* Text */}
      <div style={{ animation: "splashFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
        <h1 className="text-[#0F2C59] text-lg font-extrabold tracking-tight text-center">
          Atención Ciudadana
        </h1>
        <p className="text-neutral-400 text-[12px] font-medium text-center mt-0.5">
          Preparando tu portal...
        </p>
      </div>

      {/* Bottom dots */}
      <div
        className="absolute bottom-12 flex items-center gap-1.5"
        style={{ animation: "splashFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1 h-1 rounded-full"
            style={{
              backgroundColor: i === 1 ? "#D63031" : "#0F2C59",
              animation: "splashDot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashBar {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes splashIconPop {
          from { opacity: 0; transform: scale(0.5) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes splashRing {
          from { transform: scale(1); opacity: 0.25; }
          to   { transform: scale(1.6); opacity: 0; }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
