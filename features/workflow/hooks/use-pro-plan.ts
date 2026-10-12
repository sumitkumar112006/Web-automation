"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

export interface UseProPlanReturn {
  /**
   * Whether the currently active organization is subscribed to the Pro plan.
   * False if no organization is active or auth is not yet loaded.
   */
  isPro: boolean
  /**
   * Alias for `isPro`.
   */
  hasProPlan: boolean
  /**
   * Whether the Clerk auth state is currently loading.
   */
  isLoading: boolean
  /**
   * Whether the Clerk auth state has finished loading.
   */
  isLoaded: boolean
  /**
   * The currently active organization ID, if any.
   */
  orgId: string | null | undefined
  /**
   * The path to the pricing / upgrade page.
   */
  pricingUrl: string
  /**
   * Navigates the user to the organization pricing page to upgrade.
   */
  redirectToPricing: () => void
  /**
   * Alias for `redirectToPricing`.
   */
  goToPricing: () => void
  /**
   * Alias for `redirectToPricing`.
   */
  upgrade: () => void
  /**
   * Helper that executes the given action if on Pro, or redirects to `/pricing` if not.
   */
  guardPro: (action: () => void) => boolean
}

/**
 * Reusable hook that determines whether the currently active organization
 * is on the Pro plan and provides helpers to navigate to the pricing page.
 */
export function useProPlan(): UseProPlanReturn {
  const router = useRouter()
  const { has, isLoaded, orgId } = useAuth()

  const isPro = Boolean(
    isLoaded &&
      orgId &&
      (has?.({ plan: "pro" }) || has?.({ plan: "org:pro" }))
  )

  const pricingUrl = "/pricing"

  const redirectToPricing = useCallback(() => {
    router.push(pricingUrl)
  }, [router])

  const guardPro = useCallback(
    (action: () => void) => {
      if (!isPro) {
        redirectToPricing()
        return false
      }
      action()
      return true
    },
    [isPro, redirectToPricing]
  )

  return {
    isPro,
    hasProPlan: isPro,
    isLoading: !isLoaded,
    isLoaded,
    orgId,
    pricingUrl,
    redirectToPricing,
    goToPricing: redirectToPricing,
    upgrade: redirectToPricing,
    guardPro,
  }
}

export const usePro = useProPlan
export default useProPlan
