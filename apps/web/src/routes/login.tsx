import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '../features/auth/login-card'
import { GradientWaves } from '../components/ui/gradient-waves'
import { BorderGlow } from '../components/ui/border-glow'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="relative max-w-2xl mx-auto h-full flex-1 flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* ReactBits Gradient Waves Background with User Configured Parameters */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <GradientWaves
          height={15}
          zoom={0.7}
          tilt={1}
          horizonColor="#8e6ee5"
          waveColor="#ffffff"
          crestColor="#201a97"
          waveScale={0.65}
          amplitude={7}
          speed={0.12}
          turbulence={20}
          swell={8}
          mouseInteraction={true}
          className="w-full h-full"
        />
      </div>

      {/* Login Card with ReactBits BorderGlow */}
      <div className="relative z-10  max-w-xl flex justify-center shadow-0!  pointer-events-auto">
        <BorderGlow
          borderRadius={16}
          backgroundColor="rgba(255, 255, 255, 0.1)"
          glowColor="243 85 60"
          colors={['#5955c6', '#1C1696', '#1C1696', '#fff']}
          edgeSensitivity={30}
          glowRadius={36}
          glowIntensity={1.0}
          animated={true}
          className="w-full shadow-lg backdrop-blur-md"
        >
          <LoginCard />
        </BorderGlow>
      </div>
    </div>
  )
}
