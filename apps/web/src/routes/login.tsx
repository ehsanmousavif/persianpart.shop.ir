import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '../features/auth/login-card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <LoginCard />
    </div>
  )
}
