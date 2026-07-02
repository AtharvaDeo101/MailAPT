"use client";

import { ArrowUpRight } from "lucide-react";


const footerLinks = {
  Links: [
    { name: "Generate", href: "/generate" },
    // { name: "Summarize", href: "/summarize" },
  ],
};

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/atharvasayshelo/" },
  { name: "GitHub", href: "https://github.com/AtharvaDeo101" },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/atharva-deo-454248320?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
];

const playfair = "'Playfair Display', Georgia, serif";

export function FooterSection() {
  return (
    <footer className="relative bg-[#121931] border-t border-white/10">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <a href="/" className="inline-flex items-center gap-2 mb-6">
                <span
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.95)",
                    lineHeight: 1,
                  }}
                >
                  Mailly
                </span>
              </a>

              <p
                className="mb-8 max-w-xs"
                style={{
                  fontFamily: playfair,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
                  color: "rgba(255,255,255,0.68)",
                  lineHeight: 1.8,
                  letterSpacing: "0.01em",
                }}
              >
                Built using the powerful Llama 3.1 8B Instruct model, it
                understands your intent and transforms simple prompts into
                polished, ready-to-send and easy-to-read emails.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors flex items-center gap-1 group hover:text-white"
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "0.92rem",
                      color: "rgba(255,255,255,0.68)",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3
                  className="mb-6"
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.94)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>

                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-2 transition-colors hover:text-white"
                        style={{
                          fontFamily: playfair,
                          fontStyle: "italic",
                          fontWeight: 400,
                          fontSize: "0.92rem",
                          color: "rgba(255,255,255,0.68)",
                          textDecoration: "none",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {link.name}
                        {"badge" in link && link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-white text-black rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            style={{
              fontFamily: playfair,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.62)",
              letterSpacing: "0.02em",
            }}
          >
            2026 Mailly
          </p>
        </div>
      </div>
    </footer>
  );
}