import type { Metadata } from "next";
import "./globals.css";
import SWRProvider from "@/components/SWRProvider";

export const metadata: Metadata = {
  title: "SampleLab Admin",
  description: "Admin panel for SampleLab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
