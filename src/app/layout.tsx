import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Marketing QA SaaS",
  description: "מערכת חכמה לבקרת איכות ואופטימיזציה של קמפיינים שיווקיים",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
} 