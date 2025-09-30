import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Subscription } from '@/types/subscription'

const STORAGE_KEY = 'subscriptions'

const getSubscriptions = (): Subscription[] => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
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
      const subscription: Subscription = {
        ...newSubscription,
        id: crypto.randomUUID(),
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

  return {
    subscriptions,
    addSubscription: addMutation.mutate,
    updateSubscription: updateMutation.mutate,
    deleteSubscription: deleteMutation.mutate,
  }
}