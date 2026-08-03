"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RotatingEarth from "./rotating-earth";

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
            <div className="w-[280px] sm:w-[360px] lg:w-[460px]">
              <RotatingEarth width={460} height={460} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}