"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { TOTP } from "totp-generator"

const SecretManager = ({
  onSelectSecret,
}: {
  onSelectSecret: (secret: string) => void
}) => {
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
      setNewSecret("")
    }
  }

  const handleSelectSecret = (secret: string) => {
    onSelectSecret(secret)
  }

  return (
    <div>
      <h2>Stored Secrets</h2>
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

      <ul>
        {secrets.map((secret, index) => (
          <li key={index} className="flex justify-between mt-2">
            {secret}
            <Button
              className="w-fit"
              onClick={() => handleSelectSecret(secret)}
            >
              Use
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Page() {
  const searchParams = useSearchParams()

  const rawSecretFromParams = searchParams.get("secret") || ""
  const [rawSecret, setRawSecret] = useState(rawSecretFromParams)
  const digitsFromParams = searchParams.get("digits")
  const timePeriodFromParams = searchParams.get("timePeriod")

  const [digits, setDigits] = useState(
    digitsFromParams ? Number(digitsFromParams) : 6
  )
  const [timePeriod, setTimePeriod] = useState(
    timePeriodFromParams ? Number(timePeriodFromParams) : 30
  )
  const [algorithm, setAlgorithm] = useState<"SHA-1" | "SHA-256" | "SHA-512">(
    "SHA-1"
  )

  const [currentOtp, setCurrentOtp] = useState("")
  const [nextOtp, setNextOtp] = useState("")
  const [progress, setProgress] = useState(0)

  const handleGenerateOtp = () => {
    try {
      if (!rawSecret) {
        alert("Secret key is required")
        return
      }

      const currentTimeInMiliSeconds = Math.floor(Date.now() / 1)
      const { otp: currentOtpValue } = TOTP.generate(rawSecret, {
        digits: digits,
        algorithm: algorithm as "SHA-1" | "SHA-256" | "SHA-512",
        timestamp: currentTimeInMiliSeconds,
        period: timePeriod,
      })

      const { otp: nextOtpValue } = TOTP.generate(rawSecret, {
        digits: digits,
        algorithm: algorithm as "SHA-1" | "SHA-256" | "SHA-512",
        timestamp: currentTimeInMiliSeconds + timePeriod * 1000,
        period: timePeriod,
      })

      setCurrentOtp(currentOtpValue)
      setNextOtp(nextOtpValue)

      // Start the progress
      setProgress(0)
      let interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100 // Ensure it doesn't exceed 100
          }
          return Math.min(prev + 100 / timePeriod, 100)
        })
      }, 1000)

      // Clear the interval when done
      return () => clearInterval(interval)
    } catch (error) {
      console.error("Error generating OTP:", error)
      alert("Error generating OTP")
    }
  }

  const handleSelectSecret = (secret: string) => {
    setRawSecret(secret)
  }

  return (
    <div className="h-screen content-center grid justify-center">
      <Card className="md:w-[420px]  ">
        <CardHeader>
          <CardTitle>TOTP Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <SecretManager onSelectSecret={handleSelectSecret} />

          <div>
            <label>Secret Key (selected): {rawSecret}</label>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="numberdigit">Number of Digits:</Label>
            <Input
              type="text"
              value={digits}
              onChange={(e) => setDigits(Number(e.target.value))}
              placeholder="6 or 8"
              id="numberdigit"
            />
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="period">Time Period (seconds):</Label>
            <Input
              type="text"
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              placeholder="Default 30 seconds"
              id="period"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="algo">Algorithm:</Label>
            <Select
              value={algorithm}
              onValueChange={(value) =>
                setAlgorithm(value as "SHA-1" | "SHA-256" | "SHA-512")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Algorithm</SelectLabel>
                  <SelectItem value="SHA-1">SHA-1</SelectItem>
                  <SelectItem value="SHA-256">SHA-256</SelectItem>
                  <SelectItem value="SHA-512">SHA-512</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Progress value={100 - progress} className="w-full my-4" />
          <Button onClick={handleGenerateOtp}>Generate OTP</Button>

          {currentOtp && (
            <div>
              <p
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(currentOtp)
                }}
              >
                Current OTP: {currentOtp}
              </p>
              <p
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(nextOtp)
                }}
              >
                Next OTP: {nextOtp}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
