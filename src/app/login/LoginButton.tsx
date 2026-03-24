"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { useState } from "react"

export function LoginButton() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    await signIn("github", { callbackUrl: "/" })
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full gap-2"
      size="lg"
    >
      <Github className="h-5 w-5" />
      {loading ? "Redirecting…" : "Sign in with GitHub"}
    </Button>
  )
}
