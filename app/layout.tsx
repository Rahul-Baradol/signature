import "./globals.css";

export const metadata = {
  title: "signature",
  description:
    "cool way to visualize the audio with particles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body>
        {children}
      </body>
    </html>
  );
}
