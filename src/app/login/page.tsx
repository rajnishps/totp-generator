import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "./LoginButton"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Logo / Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">TOTP Generator</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your authenticator codes
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in with your GitHub account to continue
          </p>
          <LoginButton />
        </div>
      </div>
    </main>
  )
}
