import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { InfoPage } from "@/components/landing/info-page";

export const metadata: Metadata = {
  title: "Contact — Dispatch",
  description: "Get in touch about Dispatch — support, bug reports, privacy requests and feature ideas.",
};

const playfair = "'Playfair Display', Georgia, serif";

const channels = [
  {
    label: "Email",
    value: "atharva20051@gmail.com",
    href: "mailto:atharva20051@gmail.com",
    note: "Support, privacy and data-deletion requests. Replies usually within a few days.",
  },
  {
    label: "GitHub",
    value: "AtharvaDeo101",
    href: "https://github.com/AtharvaDeo101",
    note: "Bug reports and feature requests — open an issue on the repository.",
  },
  {
    label: "LinkedIn",
    value: "Atharva Deo",
    href: "https://www.linkedin.com/in/atharva-deo-454248320?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    note: "Work enquiries and anything else.",
  },
  {
    label: "Instagram",
    value: "@atharvasayshelo",
    href: "https://www.instagram.com/atharvasayshelo/",
    note: "Occasional updates.",
  },
];

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="Questions, bugs, privacy requests or ideas — any of these reach a real person."
      sections={[
        {
          heading: "Before you write",
          bullets: [
            "Bug reports travel best with the page you were on, what you expected and what happened instead.",
            "For data-deletion requests, send the message from the Google account you signed in with so it can be matched.",
            "You can revoke Dispatch's access to your Gmail at any time yourself, from your Google Account permissions page.",
          ],
        },
      ]}
    >
      <div className="mt-14 grid sm:grid-cols-2 gap-4">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25 hover:bg-white/[0.03]"
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex items-center gap-1 mb-2"
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.94)",
              }}
            >
              {c.label}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>

            <div
              className="mb-3 break-all"
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {c.value}
            </div>

            <p
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.58)",
                lineHeight: 1.7,
              }}
            >
              {c.note}
            </p>
          </a>
        ))}
      </div>
    </InfoPage>
  );
}
