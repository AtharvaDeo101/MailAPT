"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Connect to tool",
    description: "Login with your Gmail account.",
  },
  {
    number: "II",
    title: "Read / Write",
    description: "Using AI capabilities read and write your Emails.",
  },
  {
    number: "III",
    title: "Send / Summarize",
    description: "On a single click send or summarize the Emails.",
  },
];

const playfair = "'Playfair Display', Georgia, serif";

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 text-background overflow-hidden"
      style={{ backgroundColor: "#E76F2E" }}
    >
      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              currentColor 40px,
              currentColor 41px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* ── Header ── */}
        <div className="mb-16 lg:mb-24">
          {/* Eyebrow — Playfair italic, matches HeroSection */}
          <span
            className="inline-flex items-center gap-3 mb-6"
            style={{
              fontFamily: playfair,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "0.875rem",
              letterSpacing: "0.12em",
              color: "rgba(var(--background-rgb, 255,255,255) / 0.45)",
              opacity: 0.5,
            }}
          >
            <span
              className="w-8 h-px shrink-0"
              style={{ background: "hsl(var(--background) / 0.3)" }}
            />
            Process
          </span>

          {/* Section heading */}
          <h2
            className={`tracking-tight transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              fontFamily: playfair,
              fontWeight: 500,
              fontStyle: "normal",
              fontSize: "clamp(2.2rem, 6vw, 4rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "hsl(var(--background))",
            }}
          >
            Three steps.
            <br />
            {/* Second line italic + muted — mirrors HeroSection "Let AI handle" */}
            <span
              style={{
                fontStyle: "italic",
                color: "hsl(var(--background) / 0.45)",
              }}
            >
              Infinite possibilities.
            </span>
          </h2>
        </div>

        {/* ── Steps ── */}
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            const isHovered = hoveredStep === index;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                className="w-full text-left py-8 border-b border-background/10 transition-all duration-500 group"
                style={{
                  opacity: isActive ? 1 : isHovered ? 0.7 : 0.4,
                  /* Pop-out on hover/active — mirrors sidebar nav row */
                  transform: isActive
                    ? "translateX(8px)"
                    : isHovered
                      ? "translateX(5px)"
                      : "translateX(0)",
                  boxShadow:
                    isActive || isHovered
                      ? "-3px 0 0 0 hsl(var(--background) / 0.5)"
                      : "none",
                  transition:
                    "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <div className="flex items-start gap-6">
                  {/* Roman numeral — Playfair italic, faded */}
                  <span
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "clamp(1.4rem, 3vw, 2rem)",
                      color: isActive
                        ? "hsl(var(--background) / 0.5)"
                        : "hsl(var(--background) / 0.25)",
                      minWidth: "2.5rem",
                      lineHeight: 1,
                      transition: "color 0.3s ease",
                    }}
                  >
                    {step.number}
                  </span>

                  <div className="flex-1">
                    {/* Step title — Playfair, italic on hover/active */}
                    <h3
                      style={{
                        fontFamily: playfair,
                        fontWeight: 500,
                        fontStyle: isActive || isHovered ? "italic" : "normal",
                        fontSize: "clamp(1.5rem, 3vw, 2rem)",
                        letterSpacing:
                          isActive || isHovered ? "-0.03em" : "-0.01em",
                        lineHeight: 1.1,
                        marginBottom: "0.6rem",
                        color: "hsl(var(--background))",
                        transition:
                          "font-style 0.2s ease, letter-spacing 0.25s ease",
                      }}
                    >
                      {step.title}

                      {/* Animated underline — matches sidebar nav */}
                      <span
                        className="block h-px mt-1.5 origin-left"
                        style={{
                          background:
                            "linear-gradient(90deg, hsl(var(--background) / 0.5) 0%, transparent 100%)",
                          transform:
                            isActive || isHovered ? "scaleX(1)" : "scaleX(0)",
                          opacity: isActive ? 0.8 : 0.5,
                          transition: "transform 0.3s ease, opacity 0.3s ease",
                        }}
                        aria-hidden="true"
                      />
                    </h3>

                    {/* Description — Playfair italic, muted */}
                    <p
                      style={{
                        fontFamily: playfair,
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
                        color: "hsl(var(--background) / 0.5)",
                        lineHeight: 1.75,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {step.description}
                    </p>

                    {/* Progress bar */}
                    {isActive && (
                      <div
                        className="mt-4 overflow-hidden"
                        style={{
                          height: "1px",
                          background: "hsl(var(--background) / 0.15)",
                        }}
                      >
                        <div
                          className="h-full"
                          style={{
                            background: "hsl(var(--background) / 0.6)",
                            width: "0%",
                            animation: "progress 5s linear forwards",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
