import GenerateProviders from "./providers";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GenerateProviders>{children}</GenerateProviders>;
}