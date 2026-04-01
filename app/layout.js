import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { neobrutalism } from '@clerk/ui/themes'

import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets: ["latin"] })

export const metadata = {
  title: "ChefNova - AI Recipe Platform",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider   appearance={{theme: neobrutalism,}}>
    <html lang="en" suppressHydrationWarning> 
                        {/* notice the supress hydration warning for during devlopment */}
      <body
        className={`${inter.className}`}>


          <Header/>
          <main className="min-h-screen"> {children} </main>
          <Toaster richcolors/>
            <footer className="py-8 px-4 border-t">
              <div className="max-w-6xl mx-auto flex justify-center items-center" >
                <p className="text-stone-500 text-sm">
                  Crafted by Utkarsh🏡

                </p>
              </div>

            </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
