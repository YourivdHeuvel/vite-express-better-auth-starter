import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp, useSession } from '@/lib/auth-client'

export function SignUpPage() {
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
    const { error } = await signUp.email({
      name: String(form.get('name')),
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Sign up failed')
      return
    }
    navigate('/')
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Sign up with your email and a password."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/sign-in" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthLayout>
  )
}
