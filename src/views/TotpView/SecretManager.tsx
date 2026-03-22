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
    <div className="pt-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-end">
          <div className="grid w-full items-center gap-1.5">
            <Input
              type="text"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="Add new secret"
              id="new"
            />
          </div>

          <Button className="w-fit" onClick={handleAddSecret}>
            Add Secret
          </Button>
        </div>
      </div>

      <ul className="mt-2 overflow-y-scroll max-h-[300px]">
        {secrets.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between mt-2 items-center gap-2"
          >
            <div className="flex flex-col flex-1">
              {editingIndex === index ? (
                <div className="flex flex-row gap-1 items-center">
                  <Input
                    className="h-7 text-xs py-1"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-green-500"
                    onClick={() => handleSaveEdit(index)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500"
                    onClick={() => setEditingIndex(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 group">
                    <span
                      className={cn(
                        "text-sm font-semibold text-slate-300",
                        !entry.name && "uppercase text-md",
                      )}
                    >
                      {entry.name || entry.secret}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingIndex(index)
                        setEditingName(entry.name)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <span
                    className={cn(
                      "text-md text-slate-400 uppercase",
                      !entry.name && "hidden ",
                    )}
                  >
                    {entry.secret}
                  </span>
                </>
              )}
            </div>
            <div className="space-x-2 flex items-center">
              <Button
                className="w-fit"
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
                Use
              </Button>
              <Button
                className="w-fit"
                variant="destructive"
                onClick={() => {
                  const updatedSecrets = secrets.filter(
                    (s) => s.secret !== entry.secret,
                  )
                  setSecrets(updatedSecrets)
                  localStorage.setItem(
                    "secrets",
                    JSON.stringify(updatedSecrets),
                  )
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
