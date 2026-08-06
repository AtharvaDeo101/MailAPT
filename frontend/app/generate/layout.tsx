import { Lato, Roboto } from "next/font/google";

import GenerateProviders from "./providers";

// the font-family choices in Settings; loaded here so switching is instant
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GenerateProviders>
      <div className={`mail-ui ${lato.variable} ${roboto.variable}`}>
        {children}
      </div>
    </GenerateProviders>
  );
}
