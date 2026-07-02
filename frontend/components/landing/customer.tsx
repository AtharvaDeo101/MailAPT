"use client";

import { useEffect, useState, useRef } from "react";
import { User } from "lucide-react";

const securityFeatures = [
  {
    title: "Entrepreneurs & Startups",
    description: "Send outreach, proposals, and updates quickly.",
  },
  {
    title: "Sales & Marketing Teams",
    description: "Generate high-converting emails in seconds.",
  },
  {
    title: "Freelancers & Professionals",
    description: "Communicate professionally without effort.",
  },
  {
    title: "Students & Job Seekers",
    description: "Write applications, cold emails, and follow-ups.",
  },
];


const playfair = "'Playfair Display', Georgia, serif";

export function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="security"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-foreground/[0.02] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Eyebrow */}
            <span
              className="inline-flex items-center gap-3 mb-6"
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "0.875rem",
                letterSpacing: "0.12em",
                color: "hsl(var(--muted-foreground) / 0.55)",
              }}
            >
              <span
                className="w-8 h-px"
                style={{ background: "hsl(var(--foreground) / 0.3)" }}
              />
              Consumer
            </span>

            {/* Heading */}
            <h2
              className="mb-8"
              style={{
                fontFamily: playfair,
                fontWeight: 500,
                fontStyle: "normal",
                fontSize: "clamp(2.2rem, 6vw, 4rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "hsl(var(--foreground))",
              }}
            >
              Who is
              <br />
              <span
                style={{
                  fontStyle: "italic",
                  color: "hsl(var(--foreground))",
                }}
              >
                this for?
              </span>
            </h2>

            {/* Description */}
            <p
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1rem, 1.8vw, 1.3rem)",
                color: "hsl(var(--muted-foreground) / 0.72)",
                lineHeight: 1.75,
                letterSpacing: "0.01em",
                maxWidth: "34rem",
              }}
            >
              This application is tailored for individuals who frequently use
              email, offering features that simplify and enhance the efficiency
              of reading and writing messages.
            </p>
          </div>

          {/* Right: Features */}
          <div className="grid gap-6 " >
            
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 border border-foreground/10 hover:border-foreground/20 transition-all duration-500 group ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <User className="w-5 h-5" />
                  </div>

                  <div>
                    <h3
                      className="mb-1 group-hover:translate-x-1 transition-transform duration-300"
                      style={{
                        fontFamily: playfair,
                        fontWeight: 500,
                        fontStyle: "normal",
                        fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      {feature.title}
                    </h3>

                    <p
                      style={{
                        fontFamily: playfair,
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "0.98rem",
                        color: "hsl(var(--muted-foreground) / 0.72)",
                        lineHeight: 1.7,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional certification row */}
        <div
          className={`mt-16 lg:mt-20 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
  
        </div>
      </div>
    </section>
  );
}