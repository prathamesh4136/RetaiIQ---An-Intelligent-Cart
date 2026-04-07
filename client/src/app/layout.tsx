// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import Navbar from "../components/Navbar";



export const metadata = {
  title: "RetailIQ",
  description: "Smart retail analytics and management platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen  text-gray-900 flex flex-col overflow-x-hidden">
        <Navbar />
        <main className="flex-grow pt-18 m-0">{children}</main>
        
      </body>

    </html>
  );
}
