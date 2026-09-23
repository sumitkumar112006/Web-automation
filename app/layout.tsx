import {
  ClerkProvider,
  OrganizationSwitcher,
  Show,
  UserButton,
} from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ClerkProvider
          appearance={{ theme: shadcn }}
          taskUrls={{ "choose-organization": "/choose-organization" }}
        >
          <ThemeProvider>
            <Show when="signed-in">
              <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="font-semibold text-lg">Web Automation</div>
                  <OrganizationSwitcher
                    hidePersonal={false}
                    afterCreateOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/choose-organization"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <UserButton />
                </div>
              </header>
            </Show>
            <main>{children}</main>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
