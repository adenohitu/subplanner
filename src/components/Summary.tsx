import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Subscription } from '@/types/subscription'

interface SummaryProps {
  subscriptions: Subscription[]
}

export function Summary({ subscriptions }: SummaryProps) {
  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive !== false)

  const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
    const monthlyPrice =
      sub.billingCycle === 'monthly' ? sub.price : sub.price / 12
    return sum + monthlyPrice
  }, 0)

  const totalYearly = activeSubscriptions.reduce((sum, sub) => {
    const yearlyPrice =
      sub.billingCycle === 'yearly' ? sub.price : sub.price * 12
    return sum + yearlyPrice
  }, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-4 border-black neobrutalism-shadow-lg bg-green-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold">合計 (月額換算)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            ¥{Math.round(totalMonthly).toLocaleString()}
          </div>
          <p className="text-sm font-semibold mt-1">/ 月</p>
        </CardContent>
      </Card>

      <Card className="border-4 border-black neobrutalism-shadow-lg bg-pink-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold">合計 (年額換算)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            ¥{Math.round(totalYearly).toLocaleString()}
          </div>
          <p className="text-sm font-semibold mt-1">/ 年</p>
        </CardContent>
      </Card>

      <Card className="border-4 border-black neobrutalism-shadow-lg bg-blue-300">
        <CardHeader>
          <CardTitle className="text-lg font-bold">サブスク数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold">{subscriptions.length}</div>
            <Badge className="border-2 border-black bg-white text-black hover:bg-white">
              件
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}