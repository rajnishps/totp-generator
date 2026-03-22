"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type SecretEntry = {
  name: string
  secret: string
}

export const SecretManager = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const digitsFromParams = searchParams.get("digits")
  const timePeriodFromParams = searchParams.get("timePeriod")

  const [secrets, setSecrets] = useState<SecretEntry[]>([])
  const [newSecret, setNewSecret] = useState("")
  const [newName, setNewName] = useState("")

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  // Load secrets from local storage on component mount
  useEffect(() => {
    const storedSecrets = localStorage.getItem("secrets")
    if (storedSecrets) {
      const parsed = JSON.parse(storedSecrets)
      // Migration: convert string secrets to objects if necessary
      const migrated = parsed.map((item: any) =>
        typeof item === "string" ? { name: "", secret: item } : item,
      )
      setSecrets(migrated)
    }
  }, [])

  const handleDelete = (index: number) => {
    if (deleteConfirmIndex === index) {
      const updatedSecrets = secrets.filter((s, i) => i !== index)
      setSecrets(updatedSecrets)
      localStorage.setItem("secrets", JSON.stringify(updatedSecrets))
      setDeleteConfirmIndex(null)
    } else {
      setDeleteConfirmIndex(index)
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeleteConfirmIndex(null), 3000)
    }
  }

  const handleAddSecret = () => {
    if (newSecret && !secrets.find((s) => s.secret === newSecret)) {
      const updatedSecrets = [...secrets, { name: newName, secret: newSecret }]
      setSecrets(updatedSecrets)
      localStorage.setItem("secrets", JSON.stringify(updatedSecrets))
      router.push(
        `?secret=${newSecret}&name=${newName}&digits=${
          digitsFromParams === "null" ? 6 : digitsFromParams
        }&timePeriod=${
          timePeriodFromParams === "null" ? 30 : timePeriodFromParams
        }`,
      )
      setNewSecret("")
      setNewName("")
    }
  }

  const handleSaveEdit = (index: number) => {
    const updatedSecrets = [...secrets]
    updatedSecrets[index].name = editingName
    setSecrets(updatedSecrets)
    localStorage.setItem("secrets", JSON.stringify(updatedSecrets))
    setEditingIndex(null)
    setEditingName("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/50">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left block">Label</Label>
          <Input
            id="name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. GitHub"
            className="h-9 bg-slate-900 border-slate-800 text-xs text-slate-300 placeholder:text-slate-600 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secret" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-left block">Secret Key</Label>
          <Input
            id="secret"
            type="text"
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
            placeholder="Enter base32 secret"
            className="h-9 bg-slate-900 border-slate-800 text-xs text-slate-300 placeholder:text-slate-600 focus:ring-blue-500/20"
          />
        </div>
        <Button 
          className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors"
          onClick={handleAddSecret}
          disabled={!newSecret}
        >
          Add to Vault
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] pr-1 overflow-y-auto custom-scrollbar">
        {secrets.length === 0 && (
          <div className="text-center py-8 px-4 rounded-lg border border-dashed border-slate-800">
            <p className="text-xs text-slate-500">No secrets found in vault</p>
          </div>
        )}
        {secrets.map((entry, index) => (
          <div
            key={index}
            className={cn(
              "group p-3 rounded-xl border transition-all duration-200",
              searchParams.get("secret") === entry.secret 
                ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                : "bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/60 hover:border-slate-700"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingIndex === index ? (
                  <div className="flex flex-row gap-2 items-center">
                    <Input
                      className="h-8 text-xs bg-slate-950"
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
                        className="h-8 w-8 text-slate-400 hover:bg-slate-800"
                        onClick={() => setEditingIndex(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group/name relative">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-slate-200 truncate block text-left">
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
                    <span className="text-[10px] font-mono text-slate-500 truncate block mt-1 text-left">
                      {entry.secret}
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
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                  {searchParams.get("secret") === entry.secret ? "Active" : "Use"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 px-3 text-[10px] font-semibold transition-all",
                    deleteConfirmIndex === index 
                      ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" 
                      : "text-slate-600 hover:text-rose-400 hover:bg-rose-400/5"
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
