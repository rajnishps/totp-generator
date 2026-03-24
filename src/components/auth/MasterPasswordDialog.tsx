"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { useState } from "react"

interface MasterPasswordDialogProps {
  onSubmit: (password: string) => void
  onSkip: () => void
}

export default function MasterPasswordDialog({
  onSubmit,
  onSkip,
}: MasterPasswordDialogProps) {
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onSubmit(password.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
            <Lock className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">Vault Encryption</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Set a master password to encrypt your secrets end-to-end.
              Only you can decrypt them — or skip to store without encryption.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              autoFocus
              className="h-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:ring-blue-500/30"
            />
            <Button
              type="submit"
              disabled={!password.trim()}
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Unlock Vault
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="w-full h-9 text-zinc-500 hover:text-zinc-300 text-sm"
            >
              Skip — store without encryption
            </Button>
          </form>

          <p className="text-[10px] text-zinc-600 text-center max-w-[260px]">
            If you set a password and forget it, your secrets cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  )
}
