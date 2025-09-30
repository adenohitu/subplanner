import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen p-8">
        <h1 className="text-4xl font-bold">Subplanner</h1>
        <p className="text-muted-foreground mt-2">サブスクリプション管理アプリ</p>
      </div>
    </QueryClientProvider>
  )
}

export default App
