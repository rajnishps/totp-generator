"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export const SecretManager = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const digitsFromParams = searchParams.get("digits")
  const timePeriodFromParams = searchParams.get("timePeriod")

  const [secrets, setSecrets] = useState<string[]>([])
  const [newSecret, setNewSecret] = useState("")

  // Load secrets from local storage on component mount
  useEffect(() => {
    const storedSecrets = localStorage.getItem("secrets")
    if (storedSecrets) {
      setSecrets(JSON.parse(storedSecrets))
    }
  }, [])

  const handleAddSecret = () => {
    if (newSecret && !secrets.includes(newSecret)) {
      const updatedSecrets = [...secrets, newSecret]
      setSecrets(updatedSecrets)
      localStorage.setItem("secrets", JSON.stringify(updatedSecrets))
      router.push(
        `?secret=${newSecret}&digits=${
          digitsFromParams === "null" ? 6 : digitsFromParams
        }&timePeriod=${
          timePeriodFromParams === "null" ? 30 : timePeriodFromParams
        }`
      )
      setNewSecret("")
    }
  }

  return (
    <div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="new">New Secret</Label>
        <Input
          type="text"
          value={newSecret}
          onChange={(e) => setNewSecret(e.target.value)}
          placeholder="Add new secret"
          id="new"
        />
        <Button onClick={handleAddSecret}>Add Secret</Button>
      </div>

      <ul className="mt-2 overflow-y-scroll">
        {/* <ul className="mt-2 max-h-20 overflow-y-scroll"> */}
        {secrets.map((secret, index) => (
          <li key={index} className="flex justify-between mt-2">
            {secret}
            <div className="space-x-2">
              <Button
                className="w-fit"
                onClick={() =>
                  router.push(
                    `?secret=${secret}&digits=${
                      digitsFromParams === "null" ? 6 : digitsFromParams
                    }&timePeriod=${
                      timePeriodFromParams === "null"
                        ? 30
                        : timePeriodFromParams
                    }`
                  )
                }
              >
                Use
              </Button>
              <Button
                className="w-fit"
                variant="destructive"
                onClick={() => {
                  const updatedSecrets = secrets.filter((s) => s !== secret)
                  setSecrets(updatedSecrets)
                  localStorage.setItem(
                    "secrets",
                    JSON.stringify(updatedSecrets)
                  )
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {/* <Button
        disabled={secrets.length === 0}
        className="w-full mt-2"
        onClick={() => {
          localStorage.removeItem("secrets")
          setSecrets([])
        }}
      >
        Remove All
      </Button> */}
    </div>
  )
}
