import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { OrganizationSwitcher, PricingTable } from "@clerk/nextjs"
import { Building2, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing | Web Automation",
  description: "Choose the plan that fits your team's browser automation needs.",
}

export default async function PricingPage() {
  const { orgId } = await auth()

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-start px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>Organization Plans</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Upgrade your organization
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-muted-foreground text-balance">
            Choose the plan that fits your team&apos;s browser automation needs. Upgrade to Pro to unlock advanced capabilities.
          </p>
        </div>

        {/* Pricing Content */}
        {!orgId ? (
          <div className="mx-auto max-w-md rounded-xl border border-border/80 bg-card/60 p-6 text-center shadow-xs">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Select an Organization
            </h2>
            <p className="mt-1 text-xs text-muted-foreground text-balance">
              Organization plans and subscriptions are tied to a specific organization. Please select or create an organization to view plans and subscribe.
            </p>
            <div className="mt-5 flex justify-center">
              <OrganizationSwitcher
                hidePersonal={false}
                afterCreateOrganizationUrl="/pricing"
                afterSelectOrganizationUrl="/pricing"
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <PricingTable for="organization" />
          </div>
        )}
      </div>
    </div>
  )
}
