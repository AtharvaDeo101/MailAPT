"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Write Mail", href: "/generate" },
  { name: "Read Mail", href: "/summarize" },
  { name: "Pricing", href: "#pricing" },
];

const playfair = "'Playfair Display', Georgia, serif";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch("http://localhost:5000/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated("emailAddress" in data);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" });
    } catch {
      // silently fail
    } finally {
      setIsAuthenticated(false);
      window.location.href = "/";
    }
  };

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >

          {/* ── Logo — Playfair italic, matches HeroSection brand feel ── */}
          <a href="/" className="flex items-center gap-2 group">
            <span
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "hsl(var(--foreground))",
                fontSize: isScrolled ? "1.2rem" : "1.5rem",
                transition: "font-size 0.5s ease",
              }}
            >
              MailAPT
            </span>
          </a>

          {/* ── Desktop nav links — Playfair italic, muted ── */}
          {!checkingAuth && isAuthenticated && (
            <div className="hidden md:flex items-center gap-12">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative group transition-colors duration-300"
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "0.9rem",
                    letterSpacing: "0.01em",
                    color: "hsl(var(--foreground) / 0.6)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--foreground))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--foreground) / 0.6)")
                  }
                >
                  {link.name}
                  {/* Animated underline — matches FeaturesSection card hover */}
                  <span
                    className="absolute -bottom-1 left-0 h-px w-0 origin-left transition-all duration-300 group-hover:w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(var(--foreground) / 0.6) 0%, transparent 100%)",
                    }}
                  />
                </a>
              ))}
            </div>
          )}

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-3">
            {checkingAuth ? (
              <div className="w-28 h-9 rounded-full bg-foreground/10 animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* Sign out — Playfair italic styling */}
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-foreground/20 transition-all duration-300 hover:border-foreground/50 hover:bg-foreground/5"
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: isScrolled ? "0.75rem" : "0.875rem",
                    color: "hsl(var(--foreground) / 0.7)",
                    padding: isScrolled ? "0.3rem 1rem" : "0.45rem 1.25rem",
                    letterSpacing: "0.01em",
                    transition: "all 0.3s ease",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>

        
              </>
            ) : (
              /* Get Started CTA */
              <a
                href="/login"
                className="rounded-full transition-all duration-300 hover:opacity-85"
                style={{
                  fontFamily: playfair,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: isScrolled ? "0.75rem" : "0.875rem",
                  color: "hsl(var(--primary-foreground))",
                  background: "hsl(var(--primary))",
                  padding: isScrolled ? "0.3rem 1rem" : "0.45rem 1.5rem",
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "all 0.3s ease",
                }}
              >
                Get Started
              </a>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* ── Mobile full-screen menu ── */}
        <div
          className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          style={{ top: 0 }}
        >
          <div className="flex flex-col h-full px-8 pt-28 pb-8">

            {/* Mobile nav links — large Playfair, matches HowItWorksSection step titles */}
            {!checkingAuth && isAuthenticated && (
              <div className="flex-1 flex flex-col justify-center gap-8">
                {navLinks.map((link, i) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`transition-all duration-500 ${
                      isMobileMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: "clamp(2.4rem, 10vw, 3.5rem)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      color: "hsl(var(--foreground))",
                      textDecoration: "none",
                      transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(var(--foreground) / 0.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "hsl(var(--foreground))")
                    }
                  >
                    {/* Number prefix — like HowItWorksSection roman numerals */}
                    <span
                      style={{
                        fontFamily: playfair,
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "0.9rem",
                        color: "hsl(var(--foreground) / 0.3)",
                        letterSpacing: "0.1em",
                        marginRight: "1rem",
                        display: "inline-block",
                        verticalAlign: "middle",
                      }}
                    >
                      0{i + 1}
                    </span>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Mobile bottom CTA ── */}
            <div
              className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
                isMobileMenuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
            >
              {isAuthenticated ? (
                <>
                  <a
                    href="/summarize"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center rounded-full border border-foreground/20 transition-all duration-300 hover:bg-foreground/5"
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "1rem",
                      color: "hsl(var(--foreground))",
                      height: "3.5rem",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Summarize
                  </a>
                  <a
                    href="/generate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center rounded-full transition-all duration-300 hover:opacity-85"
                    style={{
                      fontFamily: playfair,
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: "1rem",
                      color: "hsl(var(--primary-foreground))",
                      background: "hsl(var(--primary))",
                      height: "3.5rem",
                      textDecoration: "none",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Generate Email
                  </a>
                </>
              ) : (
                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center rounded-full transition-all duration-300 hover:opacity-85"
                  style={{
                    fontFamily: playfair,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "1rem",
                    color: "hsl(var(--primary-foreground))",
                    background: "hsl(var(--primary))",
                    height: "3.5rem",
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Get Started
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}