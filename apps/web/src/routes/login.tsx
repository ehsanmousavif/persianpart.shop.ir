import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '../features/auth/login-card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-background">
      {/* Subtle ambient lighting */}
      <div
        className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <LoginCard />
      </div>
    </div>
  )
}
