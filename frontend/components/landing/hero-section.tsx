"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const words = ["write", "generate", "summarize", "send"];

/* ------------------------------------------------------------------ */
/*  Background floating paths (locked to #212842, ignores app theme)  */
/* ------------------------------------------------------------------ */

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#8f9bc9"
            strokeWidth={path.width}
            strokeOpacity={0.15 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated dotted globe: rotates continuously, sparkles pulse on    */
/*  random visible land points, rendered on canvas for performance.   */
/* ------------------------------------------------------------------ */

type SpherePoint = { x: number; y: number; z: number; land: boolean };

/* ------------------------------------------------------------------ */
/*  Real-world land mask, rasterized at 1.5deg resolution (240 x 120) */
/*  from Natural Earth coastline data (via the world-atlas dataset).  */
/*  Bit-packed and base64-encoded: bit(latI * LON_BINS + lonI) = 1    */
/*  means that lat/lon cell is land.                                  */
/* ------------------------------------------------------------------ */

const LAND_MASK_LON_BINS = 240;
const LAND_MASK_LAT_BINS = 120;
const LAND_MASK_LON_STEP = 360 / LAND_MASK_LON_BINS;
const LAND_MASK_LAT_STEP = 180 / LAND_MASK_LAT_BINS;

const LAND_MASK_BASE64 =
  "/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8D/////////////////////////////////////wIP/////////f/7///////////////////////8AAAD+////////DwDw/////////////////////w8AAADw//////8fgPAH8P///////////////////wMAAAj///////8MBMAD/////////////////////x8AAICB//////8fAAAA/P///////////////////x8AAAAA////////HwAAAP///////////////////w8AAAAAAEAo8P//fwAAAMD//////////////////z8AAAAAAAAACAAA+AAAAMD///////////////////8BAAAAAAAAAAAAewAAAAAK//////8///////////8AAAAAAAAAAAAAPwAAAAAAAADA/f8/+P///////wcAAAAAAAAAAAAAGAAAAAAAAAAA8P9/4P//////AwAAAAAAAAAAAAAAEAAAAAAAAAAAAD0AAPD/Htw/AAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABwAAAAAAAAAAAAAAAAAAAAAAAIADAAAAAAAAAACADwAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAAAAABgAMAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABwAQAAAAAAAAAACAfwAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAACA/wEAAAAAAAAAAAAAAAAAAADAAgBwAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADgDwAQAAAAAAAAAAAA/wMAAAAAAAAAAAAAAAAAAADwDwAIAAAAAAAAAAAA/w8AAAAAAPABAAAAAAAA4AP0HwAAAAAAAAAAAAAA/x8AAAAAAPAHAAAAAAAA4B/+PwAAAAAAAAAAAAAA/z8AAAAAAPAPAAAAAAAA4P//PwAAAAAAAAAAAAAA/38AAAAAAPgfAAAAAAAA4P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA+P//PwAAAAAAAAAAAAAA/v8AAAAAAPx/YAAAAAAA8P//PwAAAAAAAAAAAAAA/v8DAAAAAPz/4AAAAAAA8P//HwAAAAAAAAAAAAAA/v8fAAAAAP7/4AAAAAAA4P//D0AAAAAAAAAAAAAA/v8fAAAAAP5/wEAAAAAAgP//BwAAAAAAAAAAAAAA/v8/AAAAAP//4AEAAAAAAP7/AwAAAAAAAAAAAAAA//8/AAAAAP//4QEAAAAAAP7fAQAAAAAAAAAAAADA//8/AAAAAP//hwMAAAAAAPjHAQAAAAAAAAAAAADg//8/AAAAAP//BwEAAAAAANDHAAAAAAAAAAAAAADg//9/AAAAAP7/BwAAAAAAAICHAAAAAAAAAAAAAADw//9/AAAAAP7/BwAAAAAAAIAAAAAAAAAAAAAAAADw////AAAAAP7/AwAAAAAAAAQADAAAAAAAAAAAAAD4////AQAAAP7/AwAAAAAAHATwBgAAAAAAAAAAAAD4////AQAAAP//AwAAAADAAADiAwAAAAAAAAAAAAD8////AAAAAP//BwAAAABgAADwAQAAAAAAAAAAAAD8//8/AAAAgP//BwAAAABwMBL+AAAAAAAAAAAAAAD8//8DAAAAwP//BwAAAAA8vgEZAAAAAAAAAAAAAAD8//8BAAAAwP//DwAAAAAYPiAFAAAAAAAAAAAAAAD4/z8AAAAAwP//HwAAAAAMficAAAAAAAAAAAAAAADw/z8AAAAAgP//PwAAAAAWfCAAAAAAAAAAAAAAAADg/z8AAAAAwP///wAAAAAbMAAAAAAAAAAAAAAAAADw/x8AAAB88P///wAAAIAZ4AAAAAAAAAAAAAAAAADw/wEAAAD//////wEAYAAIAAgAAAAAAAAAAAAAAADy/wAAAID//////wEAKAAEAAwAAAAAAAAAAAAAAADBfgAAAID//////wMAOABAAAAAAAAAAAAAAAAAAICAAgAAAOD/////HwMAGADgAQ4AAAAAAAAAAAAAAMAAAAAAAOD/////PwAAHAD8AQAAAAAAAAAAAAAAAPgBAAAAAOD/////7wEAHAD+AQEAAAAAAAAAAAAAgPwAAAAAAOD/////8wcAPgD+AAEAAAAAAAAAAAAA4B8AAAAAAOD/////8x8AfoB/AAMAAAAAAAAAAAAA+DgAAwAAAOD/////+T8A/oA/AwAAAAAAAAAAAAAAfDBwAAAAAOD/////+X8A/sN/AAAAAAAAAAAAAAAAfAAIAAAAAOD//////f/A/+//BwAAAAAAAAAAAAAAfgAAAAAAAOD//////H/A////PwEAAAAAAAAAAAAgfwAAAAAAAMD///9//jPg////fwAAAAAAAAAAAACgfwAGAAAAAMD///9//8H//////wAAAAAAAAAAAADYfwACAAAAAID///8///n//////wAAAAAAAAAAAAD4/xkCAAAAAAD+//////z//////wEAAAAAAAAAAADo//8DAAAAAAD+/+///////////wEAAAAAAAAAAAD8//8DAAAAAAD8/2OA/////////4EAAAAAAAAAAAD+//8HAAAAAAD4fwAA/////////0AHAAAAAAAAAID///8fAAAAAACwfwBD/////////zA/AAAAAAAAAID///8fAAAAAAAQdADs//v//////zE4AAAAAAAAAMD///8/AAAAAAD8AMT8//H/////fzggAAAAAAAAAOD///9/AAAAAAD8AGD+//H//////xpgAAAAAAAAAOD///9/AAAAAAD8Aebn+fH//////z8AAAAAAAAAAOD/////AQAAAAD8g/EH8Pj////////gAAAAAAAAAOD/////EwAAAACA//wHfPz////////HAAAAAAAAAOD/////PwAAAACA//9P/vj///////8PAAAAAAAAAOD/////HxAAAACA//////////////8fAAAAAAAAAOD/////Gw4AAACA//////////////8fAAAAAAAAAPj/////jwAAAAAw/v////////////+/gAAAAAAAAPj////7/wMAAADi+f////////////+/AAEAAAAAAPz////5/wcAAADs8P////////////8/AAcAAAQAgP7////5/wEAAABMwOD///////////8DAA8AACAAAP///x/ofwAAAAAwYMb///////////8PAB8AAIAC4P///wPgfwAAAAAQABf///////////8fAB4AAPAB+P///wHwMwAAAAAA+A////////////9/YhgAAPjf/////wHwAwAOAAAA+M///////////////+ADAPz//////wNxDIAPAAAI8M////////////////8fAOD//////8sCH8AfAAwAwL////////////////9/GP7//////7/wJ+AfAH4AAD5++P//////////////N/D///////+Bf+D/AQAAAP6/x/+//v//////////A/7///8Hwp6hB8D/DwAAAPj/Y+z//f//////////APj/A0/8X4PkB9j//wAAAPA/AADj/v///////wc9A4AAAED8A2P/AeD/fwMAAAAAABDg9v///z//HwCAAAAAAOA/Y7UDAPD/vwEAAAAAABjAwP//9z9AAAAAAAAAAOACAAAAAPz//wcAAAAAAGAAAPz/AQAAAAAAAAAAAAC8cxgDAP7//wcAAAAAAIAHAMD/DwD0AAAAAAAAAAAHAMAB/P///w8AAAwAAAAAAAgwAAAAAAAAAAAAAAAAWPw//v///wMAAD8AAAAAAAA4AAAAAAAAAAAAAAAAAP/++f///x8AACABgGkAAOABAAAAAAAAAAAAAAAAAPj/n////2MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADofwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function decodeLandMask(base64: string): Uint8Array {
  if (typeof window === "undefined" || typeof atob !== "function") {
    return new Uint8Array(0);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let landMaskBytes: Uint8Array | null = null;

function isLand(lat: number, lon: number) {
  if (!landMaskBytes) {
    landMaskBytes = decodeLandMask(LAND_MASK_BASE64);
  }
  if (landMaskBytes.length === 0) return false;

  let lonI = Math.floor((lon + 180) / LAND_MASK_LON_STEP);
  lonI = ((lonI % LAND_MASK_LON_BINS) + LAND_MASK_LON_BINS) % LAND_MASK_LON_BINS;
  let latI = Math.floor((lat + 90) / LAND_MASK_LAT_STEP);
  latI = Math.min(LAND_MASK_LAT_BINS - 1, Math.max(0, latI));

  const bitIndex = latI * LAND_MASK_LON_BINS + lonI;
  const byte = landMaskBytes[bitIndex >> 3];
  return ((byte >> bitIndex % 8) & 1) === 1;
}

function generateSpherePoints(count: number): SpherePoint[] {
  const pts: SpherePoint[] = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (Math.atan2(z, x) * 180) / Math.PI;

    pts.push({ x, y, z, land: isLand(lat, lon) });
  }
  return pts;
}

function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let animationId = 0;

    const points = generateSpherePoints(2200);

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    type Sparkle = { idx: number; start: number; duration: number };
    let sparkles: Sparkle[] = [];
    let lastSparkleCheck = 0;
    let theta = 0;
    let lastTime = performance.now();

    function frame(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      theta += dt * 0.00012;

      context!.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) / 2 - 6;

      // subtle translucent fill so the globe still reads as a sphere,
      // without being fully see-through
      const grad = context!.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.35,
        R * 0.1,
        cx,
        cy,
        R
      );
      grad.addColorStop(0, "rgba(70, 82, 130, 0.045)");
      grad.addColorStop(0.7, "rgba(30, 36, 64, 0.04)");
      grad.addColorStop(1, "rgba(12, 14, 30, 0.06)");
      context!.beginPath();
      context!.arc(cx, cy, R, 0, Math.PI * 2);
      context!.fillStyle = grad;
      context!.fill();

      // border made of small dots
      const borderDotCount = 140;
      for (let i = 0; i < borderDotCount; i++) {
        const angle = (i / borderDotCount) * Math.PI * 2;
        const bx = cx + Math.cos(angle) * R;
        const by = cy + Math.sin(angle) * R;
        context!.beginPath();
        context!.arc(bx, by, 1.1, 0, Math.PI * 2);
        context!.fillStyle = "rgba(232,236,255,0.45)";
        context!.fill();
      }

      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const visibleLand: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!p.land) continue;
        const rx = p.x * cosT + p.z * sinT;
        const rz = -p.x * sinT + p.z * cosT;
        if (rz <= 0.02) continue;

        const sx = cx + rx * R;
        const sy = cy - p.y * R;
        const size = 0.6 + rz * 1.3;
        const alpha = 0.25 + rz * 0.65;

        context!.beginPath();
        context!.arc(sx, sy, size, 0, Math.PI * 2);
        context!.fillStyle = `rgba(232,236,255,${alpha})`;
        context!.fill();

        visibleLand.push(i);
      }

      // spawn new sparkles
      if (now - lastSparkleCheck > 260) {
        lastSparkleCheck = now;
        if (
          sparkles.length < 4 &&
          visibleLand.length > 0 &&
          Math.random() < 0.55
        ) {
          const idx =
            visibleLand[Math.floor(Math.random() * visibleLand.length)];
          sparkles.push({
            idx,
            start: now,
            duration: 1400 + Math.random() * 800,
          });
        }
      }

      sparkles = sparkles.filter((s) => now - s.start < s.duration);

      for (const s of sparkles) {
        const p = points[s.idx];
        const rx = p.x * cosT + p.z * sinT;
        const rz = -p.x * sinT + p.z * cosT;
        if (rz <= 0.02) continue;

        const sx = cx + rx * R;
        const sy = cy - p.y * R;
        const t = (now - s.start) / s.duration;
        const pulse = Math.sin(t * Math.PI);
        const glowR = 2 + pulse * 11;

        const glow = context!.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glow.addColorStop(0, `rgba(255,255,255,${0.9 * pulse})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");

        context!.beginPath();
        context!.arc(sx, sy, glowR, 0, Math.PI * 2);
        context!.fillStyle = glow;
        context!.fill();

        context!.beginPath();
        context!.arc(sx, sy, 1.6, 0, Math.PI * 2);
        context!.fillStyle = `rgba(255,255,255,${0.2 + 0.8 * pulse})`;
        context!.fill();
      }

      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block" />

      {/* decorative arcs, matching the reference image's swoosh lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M40,60 C10,90 -10,140 20,190"
          stroke="#e879f9"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <path
          d="M330,60 C372,92 380,142 338,202"
          stroke="#e879f9"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <path
          d="M18,330 C60,362 122,368 172,346"
          stroke="#e879f9"
          strokeWidth="1"
          strokeOpacity="0.28"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                      */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#212842" }}
    >
      {/* Background: floating paths, locked to #212842 base regardless of app theme */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex flex-1 flex-col justify-center max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          {/* Left: text content */}
          <div>
            {/* Eyebrow */}
            <div
              className={`mb-8 transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <span
                className="inline-flex items-center gap-3 text-sm text-white/70"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  letterSpacing: "0.12em",
                }}
              >
                <span className="w-8 h-px bg-white/40 not-italic" />
                The platform for modern Emails
              </span>
            </div>

            {/* Headline (reduced size) */}
            <div className="mb-12">
              <h1
                className={`leading-[0.95] tracking-tight text-white transition-all duration-1000 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 100,
                  fontSize: "clamp(2.25rem, 6vw, 5rem)",
                }}
              >
                <span className="block">The platform</span>

                <span className="block">
                  <span>to </span>
                  <span className="relative inline-block">
                    <span key={wordIndex} className="inline-flex italic">
                      {words[wordIndex].split("").map((char, i) => (
                        <span
                          key={`${wordIndex}-${i}`}
                          className="inline-block animate-char-in"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          {char}
                        </span>
                      ))}
                    </span>

                    <span className="absolute -bottom-2 left-0 right-0 h-3 bg-white/15" />
                  </span>
                </span>
              </h1>
            </div>

            {/* Description */}
            <p
              className={`leading-relaxed max-w-xl text-white/75 transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1rem, 2vw, 1.35rem)",
                letterSpacing: "0.01em",
                fontWeight: 400,
              }}
            >
              Smarter emails start here — read and write with ease.
              <br />
              <span className="text-white/50 text-[0.85em]">
                Turn email chaos into clarity.
              </span>
            </p>
          </div>

          {/* Right: animated globe */}
          <div
            className={`flex justify-center lg:justify-end transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[460px] lg:h-[460px]">
              <AnimatedGlobe />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}