import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut, useSession } from '@/lib/auth-client'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [me, setMe] = useState<unknown>(null)

  // Example call to a protected Express route.
  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then(setMe)
  }, [])

  async function onSignOut() {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {session?.user.name}</CardTitle>
          <CardDescription>{session?.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-muted-foreground">
            Response from <code>GET /api/me</code>:
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(me, null, 2)}</pre>
        </CardContent>
      </Card>
    </main>
  )
}
