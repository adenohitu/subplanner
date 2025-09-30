import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { SubscriptionForm } from './SubscriptionForm'
import type { Subscription } from '@/types/subscription'

interface SubscriptionCardProps {
  subscription: Subscription
  onUpdate: (data: Subscription | Omit<Subscription, 'id'>) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
}

export function SubscriptionCard({
  subscription,
  onUpdate,
  onDelete,
  onToggleActive,
}: SubscriptionCardProps) {
  const monthlyPrice =
    subscription.billingCycle === 'monthly'
      ? subscription.price
      : subscription.price / 12

  const yearlyPrice =
    subscription.billingCycle === 'yearly'
      ? subscription.price
      : subscription.price * 12

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card
      className={`border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${subscription.color || 'bg-yellow-300'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Switch
              checked={subscription.isActive !== false}
              onCheckedChange={() => onToggleActive(subscription.id)}
              className="mt-1"
            />
            <div>
              <h3 className="text-2xl font-bold">{subscription.name}</h3>
              {subscription.category && (
                <Badge className="mt-2 border-2 border-black bg-white text-black hover:bg-white">
                  {subscription.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <SubscriptionForm
              subscription={subscription}
              onSubmit={onUpdate}
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-2 border-black"
                >
                  編集
                </Button>
              }
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(subscription.id)}
              className="border-2 border-black"
            >
              削除
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold">
              ¥{subscription.price.toLocaleString()}
            </span>
            <span className="text-lg font-semibold">
              / {subscription.billingCycle === 'monthly' ? '月' : '年'}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p>月額換算: ¥{Math.round(monthlyPrice).toLocaleString()}</p>
            <p>年額換算: ¥{Math.round(yearlyPrice).toLocaleString()}</p>
          </div>
          <div className="pt-2 border-t-2 border-black">
            <p className="text-sm font-medium">
              次回更新: {formatDate(subscription.nextBillingDate)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}