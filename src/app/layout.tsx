import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Business Plan Generator",
    template: "%s | Business Plan Generator"
  },
  description: "Transformez vos données en business plans bancables avec notre plateforme professionnelle. Créez, analysez et exportez vos business plans avec calculs financiers automatisés.",
  keywords: ["business plan", "finances", "startup", "entrepreneuriat", "business", "plan financier"],
  authors: [{ name: "Business Plan Generator" }],
  creator: "Business Plan Generator",
  publisher: "Business Plan Generator",
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
