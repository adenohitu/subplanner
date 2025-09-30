import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Subscription } from '@/types/subscription'

const STORAGE_KEY = 'subplanner_subscriptions'

const getSubscriptions = (): Subscription[] => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const subscriptions: Subscription[] = stored ? JSON.parse(stored) : []
  // Sort by order field, fallback to original order
  return subscriptions.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

const saveSubscriptions = (subscriptions: Subscription[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
}

export const useSubscriptions = () => {
  const queryClient = useQueryClient()

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  })

  const addMutation = useMutation({
    mutationFn: (newSubscription: Omit<Subscription, 'id'>) => {
      const maxOrder = subscriptions.reduce((max, sub) => Math.max(max, sub.order ?? 0), 0)
      const subscription: Subscription = {
        ...newSubscription,
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        isActive: true,
      }
      const updated = [...subscriptions, subscription]
      saveSubscriptions(updated)
      return Promise.resolve(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (updatedSubscription: Subscription) => {
      const updated = subscriptions.map((sub) =>
        sub.id === updatedSubscription.id ? updatedSubscription : sub
      )
      saveSubscriptions(updated)
      return Promise.resolve(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const updated = subscriptions.filter((sub) => sub.id !== id)
      saveSubscriptions(updated)
      return Promise.resolve(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (reorderedSubscriptions: Subscription[]) => {
      // Update order field for all subscriptions
      const updated = reorderedSubscriptions.map((sub, index) => ({
        ...sub,
        order: index,
      }))
      saveSubscriptions(updated)
      return Promise.resolve(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => {
      const updated = subscriptions.map((sub) =>
        sub.id === id ? { ...sub, isActive: !sub.isActive } : sub
      )
      saveSubscriptions(updated)
      return Promise.resolve(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  return {
    subscriptions,
    addSubscription: addMutation.mutate,
    updateSubscription: updateMutation.mutate,
    deleteSubscription: deleteMutation.mutate,
    reorderSubscriptions: reorderMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
  }
}