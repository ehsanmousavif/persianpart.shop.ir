import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "../features/auth/login-card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative h-full min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-muted/4">
      {/* Subtle ambient lighting */}
      <div
        className="absolute top-0 inset-x-0 h-full to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md my-auto">
        <LoginCard />
      </div>
    </div>
  );
}
