import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
      >
        <body>
          <ThemeProvider>
            <header className="flex items-center gap-4 p-4 border-b">
              <nav className="flex-1 flex gap-4">
                <Link href="/" className="text-sm hover:underline">Home</Link>
                <Link href="/topics" className="text-sm hover:underline">Topics</Link>
              </nav>
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}