import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BillingCycle, Subscription } from '@/types/subscription'

interface SubscriptionFormProps {
  subscription?: Subscription
  onSubmit: (data: Omit<Subscription, 'id'> | Subscription) => void
  trigger?: React.ReactNode
}

const COLORS = [
  { name: 'Yellow', value: 'bg-yellow-400' },
  { name: 'Pink', value: 'bg-pink-400' },
  { name: 'Blue', value: 'bg-blue-400' },
  { name: 'Green', value: 'bg-green-400' },
  { name: 'Purple', value: 'bg-purple-400' },
  { name: 'Orange', value: 'bg-orange-400' },
]

export function SubscriptionForm({
  subscription,
  onSubmit,
  trigger,
}: SubscriptionFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(subscription?.name || '')
  const [price, setPrice] = useState(subscription?.price?.toString() || '')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle || 'monthly'
  )
  const [nextBillingDate, setNextBillingDate] = useState(
    subscription?.nextBillingDate || ''
  )
  const [category, setCategory] = useState(subscription?.category || '')
  const [color, setColor] = useState(subscription?.color || 'bg-yellow-400')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      name,
      price: parseFloat(price),
      billingCycle,
      nextBillingDate,
      category,
      color,
    }

    if (subscription) {
      onSubmit({ ...data, id: subscription.id })
    } else {
      onSubmit(data)
    }

    setOpen(false)
    if (!subscription) {
      setName('')
      setPrice('')
      setBillingCycle('monthly')
      setNextBillingDate('')
      setCategory('')
      setColor('bg-yellow-400')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            + 新規追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-4 border-black neobrutalism-shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {subscription ? 'サブスク編集' : '新規サブスク'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">サービス名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-black"
              required
            />
          </div>
          <div>
            <Label htmlFor="price">料金（円）</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border-2 border-black"
              required
            />
          </div>
          <div>
            <Label htmlFor="billingCycle">支払い周期</Label>
            <Select value={billingCycle} onValueChange={(value) => setBillingCycle(value as BillingCycle)}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black">
                <SelectItem value="monthly">月額</SelectItem>
                <SelectItem value="yearly">年額</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nextBillingDate">次回更新日</Label>
            <Input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="border-2 border-black"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">カテゴリ</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border-2 border-black"
              placeholder="例: エンタメ、仕事、健康"
            />
          </div>
          <div>
            <Label>カラー</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 border-2 border-black ${c.value} ${
                    color === c.value ? 'ring-4 ring-black' : ''
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            {subscription ? '更新' : '追加'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}