import { SubscriptionCard } from './SubscriptionCard'
import type { Subscription } from '@/types/subscription'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onUpdate: (data: Subscription | Omit<Subscription, 'id'>) => void
  onDelete: (id: string) => void
}

export function SubscriptionList({
  subscriptions,
  onUpdate,
  onDelete,
}: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-black neobrutalism-shadow bg-white">
        <p className="text-xl font-bold text-muted-foreground">
          サブスクリプションがまだありません
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          「新規追加」ボタンから追加してください
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subscriptions.map((subscription) => (
        <SubscriptionCard
          key={subscription.id}
          subscription={subscription}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}