export type BillingCycle = 'monthly' | 'yearly'

export interface Subscription {
  id: string
  name: string
  price: number
  billingCycle: BillingCycle
  nextBillingDate: string
  category?: string
  color?: string
}