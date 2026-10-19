import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '../features/auth/login-card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-background">
      {/* Subtle architectural ambient gradient */}
      <div
        className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,39,69,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.12),transparent)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle fine grid pattern */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 dark:opacity-8 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_70%,transparent_100%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-[440px]">
        <LoginCard />
      </div>
    </div>
  )
}
