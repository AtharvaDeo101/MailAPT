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
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const hasDarkClass = html.classList.contains("dark");
      const hasDarkDataTheme = html.getAttribute("data-theme") === "dark";
      setIsDarkTheme(hasDarkClass || hasDarkDataTheme);
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const primaryText = isDarkTheme ? "#ffffff" : "hsl(var(--background))";
  const mutedText = isDarkTheme
    ? "rgba(255, 255, 255, 0.5)"
    : "hsl(var(--background) / 0.45)";
  const subtleText = isDarkTheme
    ? "rgba(255, 255, 255, 0.25)"
    : "hsl(var(--background) / 0.25)";
  const borderColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.1)"
    : "rgb(255 255 255 / 0.1)";
  const lineColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.3)"
    : "hsl(var(--background) / 0.3)";
  const activeShadow = isDarkTheme
    ? "-3px 0 0 0 rgba(255,255,255,0.5)"
    : "-3px 0 0 0 hsl(var(--background) / 0.5)";
  const underlineGradient = isDarkTheme
    ? "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)"
    : "linear-gradient(90deg, hsl(var(--background) / 0.5) 0%, transparent 100%)";
  const progressTrack = isDarkTheme
    ? "rgba(255,255,255,0.15)"
    : "hsl(var(--background) / 0.15)";
  const progressFill = isDarkTheme
    ? "rgba(255,255,255,0.6)"
    : "hsl(var(--background) / 0.6)";
  const eyebrowText = isDarkTheme
    ? "rgba(255, 255, 255, 0.45)"
    : "rgba(var(--background-rgb, 255,255,255) / 0.45)";

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 text-background overflow-hidden"
      style={{ backgroundColor: "#121931" }}
    >
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
        <div className="mb-16 lg:mb-24">
          <span
            className="inline-flex items-center gap-3 mb-6"
            style={{
              fontFamily: playfair,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "0.875rem",
              letterSpacing: "0.12em",
              color: eyebrowText,
              opacity: 0.5,
            }}
          >
            <span
              className="w-8 h-px shrink-0"
              style={{ background: lineColor }}
            />
            Process
          </span>

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
              color: primaryText,
            }}
          >
            Three steps.
            <br />
            <span
              style={{
                fontStyle: "italic",
                color: mutedText,
              }}
            >
              Infinite possibilities.
            </span>
          </h2>
        </div>

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
                className="w-full text-left py-8 transition-all duration-500 group"
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  opacity: isActive ? 1 : isHovered ? 0.7 : 0.4,
                  transform: isActive
                    ? "translateX(8px)"
                    : isHovered
                      ? "translateX(5px)"
                      : "translateX(0)",
                  boxShadow: isActive || isHovered ? activeShadow : "none",
                  transition:
                    "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <div className="flex items-start gap-6">
                  <span
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "clamp(1.4rem, 3vw, 2rem)",
                      color: isActive ? mutedText : subtleText,
                      minWidth: "2.5rem",
                      lineHeight: 1,
                      transition: "color 0.3s ease",
                    }}
                  >
                    {step.number}
                  </span>

                  <div className="flex-1">
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
                        color: primaryText,
                        transition:
                          "font-style 0.2s ease, letter-spacing 0.25s ease",
                      }}
                    >
                      {step.title}

                      <span
                        className="block h-px mt-1.5 origin-left"
                        style={{
                          background: underlineGradient,
                          transform:
                            isActive || isHovered ? "scaleX(1)" : "scaleX(0)",
                          opacity: isActive ? 0.8 : 0.5,
                          transition: "transform 0.3s ease, opacity 0.3s ease",
                        }}
                        aria-hidden="true"
                      />
                    </h3>

                    <p
                      style={{
                        fontFamily: playfair,
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
                        color: mutedText,
                        lineHeight: 1.75,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {step.description}
                    </p>

                    {isActive && (
                      <div
                        className="mt-4 overflow-hidden"
                        style={{
                          height: "1px",
                          background: progressTrack,
                        }}
                      >
                        <div
                          className="h-full"
                          style={{
                            background: progressFill,
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