"use client";

import { useEffect, useState } from "react";

const words = ["write", "generate", "summarize", "send"];

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
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/1.jpg"
          alt=""
          width={1400}
          height={800}
          loading="eager"
          className="h-full w-full object-cover object-top"
        />

        {/* Subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-transparent" />
      </div>

      {/* Animated sphere */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-40 pointer-events-none z-10">
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/10"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/10"
            style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex flex-1 flex-col justify-center max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-32 lg:py-40">
        {/* Eyebrow */}
        <div
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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

        {/* Headline */}
        <div className="mb-12">
          <h1
            className={`leading-[0.9] tracking-tight text-white transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 100,
              fontSize: "clamp(3rem, 12vw, 10rem)",
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p
            className={`leading-relaxed max-w-xl text-white/75 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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
      </div>
    </section>
  );
}