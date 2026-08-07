import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";

const playfair = "'Playfair Display', Georgia, serif";

export type InfoSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

const body = {
  fontFamily: playfair,
  fontStyle: "italic" as const,
  fontWeight: 400,
  fontSize: "clamp(0.98rem, 1.4vw, 1.08rem)",
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.9,
  letterSpacing: "0.01em",
};

/** Shared shell for /about, /contact, /terms and /privacy. */
export function InfoPage({
  title,
  intro,
  updated,
  sections,
  children,
}: {
  title: string;
  intro: string;
  updated?: string;
  sections: InfoSection[];
  children?: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#121931] noise-overlay">
      <Navigation />

      <div className="max-w-[820px] mx-auto px-6 lg:px-12 pt-36 pb-24 lg:pt-44 lg:pb-32">
        <h1
          style={{
            fontFamily: playfair,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
            letterSpacing: "-0.03em",
            color: "rgba(255,255,255,0.95)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        <p className="mt-6" style={{ ...body, fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)" }}>
          {intro}
        </p>

        {updated && (
          <p className="mt-4" style={{ ...body, fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
            Last updated {updated}
          </p>
        )}

        <div className="mt-14 space-y-12">
          {sections.map((section, i) => (
            <section key={section.heading ?? i}>
              {section.heading && (
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "clamp(1.25rem, 2.4vw, 1.6rem)",
                    letterSpacing: "-0.02em",
                    color: "rgba(255,255,255,0.94)",
                  }}
                >
                  {section.heading}
                </h2>
              )}

              {section.paragraphs?.map((text) => (
                <p key={text} className="mb-4" style={body}>
                  {text}
                </p>
              ))}

              {section.bullets && (
                <ul className="space-y-3 pl-5" style={{ listStyleType: "disc" }}>
                  {section.bullets.map((text) => (
                    <li key={text} style={{ ...body, lineHeight: 1.7 }}>
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {children}
      </div>

      <FooterSection />
    </main>
  );
}
