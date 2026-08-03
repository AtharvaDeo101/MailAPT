import GenerateProviders from "./providers";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GenerateProviders>
      <div className="mail-ui">{children}</div>
    </GenerateProviders>
  );
}
