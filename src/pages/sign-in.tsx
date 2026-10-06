import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, useSession } from '@/lib/auth-client'

export function SignInPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [pending, setPending] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    const { error } = await signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Sign in failed')
      return
    }
    navigate('/')
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Enter your email and password to continue."
      footer={
        <span>
          No account yet?{' '}
          <Link to="/sign-up" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
