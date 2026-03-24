"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Edit2, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { encryptSecret, decryptSecret } from "@/lib/crypto"

type DecryptedEntry = {
  id: string
  name: string
  secret: string // decrypted plaintext
}

type EncryptedEntry = {
  id: string
  name: string
  encryptedSecret: string
  iv: string
  salt: string
}

interface SecretManagerProps {
  masterPassword: string
}

export const SecretManager = ({ masterPassword }: SecretManagerProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const digitsFromParams = searchParams.get("digits")
  const timePeriodFromParams = searchParams.get("timePeriod")

  const [secrets, setSecrets] = useState<DecryptedEntry[]>([])
  const [newSecret, setNewSecret] = useState("")
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null,
  )

  // Fetch & decrypt secrets from the API
  const fetchSecrets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/secrets")
      if (!res.ok) return

      const encrypted: EncryptedEntry[] = await res.json()

      const decrypted = await Promise.all(
        encrypted.map(async (entry) => {
          try {
            // No password = stored as plaintext (iv/salt will be empty)
            const plaintext =
              masterPassword === ""
                ? entry.encryptedSecret
                : await decryptSecret(
                    entry.encryptedSecret,
                    entry.iv,
                    entry.salt,
                    masterPassword,
                  )
            return { id: entry.id, name: entry.name, secret: plaintext }
          } catch {
            return { id: entry.id, name: entry.name, secret: "⚠️ DECRYPT ERROR" }
          }
        }),
      )

      setSecrets(decrypted)

      // Auto-select first secret if none selected
      if (decrypted.length > 0 && !searchParams.get("secret")) {
        const first = decrypted[0]
        router.push(
          `?secret=${first.secret}&name=${first.name}&digits=${
            digitsFromParams || 6
          }&timePeriod=${timePeriodFromParams || 30}`,
        )
      }
    } finally {
      setLoading(false)
    }
  }, [masterPassword, searchParams, router, digitsFromParams, timePeriodFromParams])

  useEffect(() => {
    fetchSecrets()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSecret = async () => {
    if (!newSecret || saving) return
    setSaving(true)
    try {
      // No password = store as plaintext with empty iv/salt
      const payload =
        masterPassword === ""
          ? { encryptedSecret: newSecret, iv: "", salt: "" }
          : await encryptSecret(newSecret, masterPassword).then(
              ({ ciphertext, iv, salt }) => ({ encryptedSecret: ciphertext, iv, salt }),
            )

      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName || "Untitled",
          ...payload,
        }),
      })

      if (res.ok) {
        const created = await res.json()
        setSecrets((prev) => [
          ...prev,
          { id: created.id, name: created.name, secret: newSecret },
        ])

        router.push(
          `?secret=${newSecret}&name=${newName || "Untitled"}&digits=${
            digitsFromParams === "null" ? 6 : digitsFromParams
          }&timePeriod=${
            timePeriodFromParams === "null" ? 30 : timePeriodFromParams
          }`,
        )
        setNewSecret("")
        setNewName("")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (index: number) => {
    if (deleteConfirmIndex === index) {
      const entry = secrets[index]
      const res = await fetch(`/api/secrets/${entry.id}`, { method: "DELETE" })
      if (res.ok) {
        setSecrets((prev) => prev.filter((_, i) => i !== index))
      }
      setDeleteConfirmIndex(null)
    } else {
      setDeleteConfirmIndex(index)
      setTimeout(() => setDeleteConfirmIndex(null), 3000)
    }
  }

  const handleSaveEdit = async (index: number) => {
    const entry = secrets[index]
    const res = await fetch(`/api/secrets/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName }),
    })
    if (res.ok) {
      setSecrets((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], name: editingName }
        return updated
      })
    }
    setEditingIndex(null)
    setEditingName("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        <span className="ml-2 text-xs text-zinc-500">Decrypting vault…</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold text-left block"
          >
            Label
          </Label>
          <Input
            id="name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. GitHub"
            className="h-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-600 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="secret"
            className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold text-left block"
          >
            Secret Key
          </Label>
          <Input
            id="secret"
            type="text"
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
            placeholder="Enter base32 secret"
            className="h-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-600 focus:ring-blue-500/20"
          />
        </div>
        <Button
          className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors"
          onClick={handleAddSecret}
          disabled={!newSecret || saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Encrypting…
            </>
          ) : (
            "Add to Vault"
          )}
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] pr-1 overflow-y-auto custom-scrollbar">
        {secrets.length === 0 && (
          <div className="text-center py-8 px-4 rounded-lg border border-dashed border-zinc-800">
            <p className="text-xs text-zinc-500">No secrets found in vault</p>
          </div>
        )}
        {secrets.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              "group p-3 rounded-xl border transition-all duration-200",
              searchParams.get("secret") === entry.secret
                ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                : "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingIndex === index ? (
                  <div className="flex flex-row gap-2 items-center">
                    <Input
                      className="h-8 text-xs bg-zinc-950"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                        onClick={() => handleSaveEdit(index)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:bg-zinc-800"
                        onClick={() => setEditingIndex(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group/name relative">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200 truncate block text-left">
                        {entry.name || "Untitled"}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingIndex(index)
                          setEditingName(entry.name)
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 truncate block mt-1 text-left">
                      {entry.secret.startsWith("⚠️")
                        ? entry.secret
                        : entry.secret}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 min-w-[70px]">
                <Button
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-[10px] font-bold uppercase tracking-wider transition-all",
                    searchParams.get("secret") === entry.secret
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
                  )}
                  onClick={() =>
                    router.push(
                      `?secret=${entry.secret}&name=${entry.name}&digits=${
                        digitsFromParams === "null" ? 6 : digitsFromParams
                      }&timePeriod=${
                        timePeriodFromParams === "null"
                          ? 30
                          : timePeriodFromParams
                      }`,
                    )
                  }
                >
                  {searchParams.get("secret") === entry.secret
                    ? "Active"
                    : "Use"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 px-3 text-[10px] font-semibold transition-all",
                    deleteConfirmIndex === index
                      ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                      : "text-zinc-600 hover:text-rose-400 hover:bg-rose-400/5",
                  )}
                  onClick={() => handleDelete(index)}
                >
                  {deleteConfirmIndex === index ? "Confirm?" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
