import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goofy Kitchen AI | Smartly Silly Recipes",
  description: "Type in your sad leftover ingredients and let the Smart Fridge judge your lifestyle choices. Powered by Gemini RAG & Hybrid Search.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
