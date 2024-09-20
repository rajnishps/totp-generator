"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { TOTP } from "totp-generator"
import { SecretManager } from "./SecretManager"
import { useToast } from "@/hooks/use-toast"

type AlgoType = "SHA-1" | "SHA-256" | "SHA-512"

const DEFAULT_DIGITS = 6
const DEFAULT_SECRET = "F3E4RG34EW34WFE"
const DEFAULT_TIME_PERIOD = 30
const DEFAULT_ALGORITHM: AlgoType = "SHA-1"

export default function TotpView() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [rawSecret, setRawSecret] = useState(
    searchParams.get("secret") || DEFAULT_SECRET
  )
  const [digits, setDigits] = useState(
    Number(searchParams.get("digits")) || DEFAULT_DIGITS
  )
  const [timePeriod, setTimePeriod] = useState(
    Number(searchParams.get("timePeriod")) || DEFAULT_TIME_PERIOD
  )
  const [algorithm, setAlgorithm] = useState<AlgoType>(
    (searchParams.get("algorithm") as AlgoType) || DEFAULT_ALGORITHM
  )

  const [currentOtp, setCurrentOtp] = useState("")
  const [nextOtp, setNextOtp] = useState("")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const storedSecrets = localStorage.getItem("secrets")
    let firstSecret = ""
    if (storedSecrets) {
      firstSecret = JSON.parse(storedSecrets)[0]
    }
    const secret =
      searchParams.get("secret") || firstSecret ? firstSecret : DEFAULT_SECRET
    const digitsParam = Number(searchParams.get("digits")) || DEFAULT_DIGITS
    const timePeriodParam =
      Number(searchParams.get("timePeriod")) || DEFAULT_TIME_PERIOD
    const algorithmParam =
      (searchParams.get("algorithm") as AlgoType) || DEFAULT_ALGORITHM

    // Update state if params change
    setRawSecret(secret)
    setDigits(digitsParam)
    setTimePeriod(timePeriodParam)
    setAlgorithm(algorithmParam)
  }, [searchParams])

  useEffect(() => {
    const updateParams = () => {
      router.push(
        `?secret=${rawSecret}&digits=${digits}&timePeriod=${timePeriod}&algorithm=${algorithm}`
      )
    }

    updateParams()
  }, [digits, rawSecret, timePeriod, algorithm, router])

  const handleGenerateOtp = useCallback(() => {
    const currentTimeInMiliSeconds = Math.floor(Date.now() / 1)
    const generateOtp = (timestamp: number) =>
      TOTP.generate(rawSecret, {
        digits,
        algorithm,
        timestamp,
        period: timePeriod,
      }).otp

    setCurrentOtp(generateOtp(currentTimeInMiliSeconds))
    setNextOtp(generateOtp(currentTimeInMiliSeconds + timePeriod * 1000))

    // Start the progress
    const now = new Date()
    let currentSeconds = now.getSeconds()
    let elapsedSeconds = currentSeconds % timePeriod // Calculate elapsed seconds within the current period
    let progressValue = (elapsedSeconds / timePeriod) * 100 // Calculate initial progress

    setProgress(progressValue) // Set initial progress based on current seconds

    const interval = setInterval(() => {
      const now = new Date()
      currentSeconds = now.getSeconds()

      if (currentSeconds % timePeriod === 0) {
        // Reset progress every time the time period elapses
        setProgress(0)
      } else {
        elapsedSeconds = currentSeconds % timePeriod // Calculate elapsed seconds
        progressValue = (elapsedSeconds / timePeriod) * 100 // Calculate progress
        setProgress(progressValue)
      }
    }, 1000)

    // Clear interval on cleanup
    return () => clearInterval(interval)
  }, [rawSecret, digits, algorithm, timePeriod])

  useEffect(() => {
    if (progress < 5) {
      handleGenerateOtp()
    } else {
      handleGenerateOtp()
    }
  }, [progress, rawSecret, digits, algorithm, timePeriod])

  return (
    <div className="h-screen content-center grid justify-center">
      <Card className="md:w-[420px]">
        <CardHeader>
          <CardTitle>TOTP Generator : {rawSecret}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="time">Number of Digits:</Label>
            <Select
              value={digits.toString()}
              onValueChange={(value) => setDigits(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an number of digits" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Number of Digits</SelectLabel>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="time">Time Period:</Label>
            <Select
              value={timePeriod.toString()}
              onValueChange={(value) => setTimePeriod(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Time Period (seconds)</SelectLabel>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="algo">Algorithm:</Label>
            <Select
              value={algorithm}
              onValueChange={(value) => setAlgorithm(value as AlgoType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an algorithm" />
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
          {/* <Button onClick={handleGenerateOtp}>Generate OTP</Button> */}

          {currentOtp && (
            <div className="space-y-2">
              <div className="flex justify-between mx-4 items-center ">
                <p className="cursor-pointer">Current OTP: {currentOtp}</p>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(currentOtp)
                    toast({
                      title: "OTP Copied",
                      description: "Current OTP has been copied to clipboard",
                    })
                  }}
                >
                  Copy OTP
                </Button>
              </div>
              <div className="flex justify-between mx-4 items-center ">
                <p className="cursor-pointer">Next OTP: {nextOtp}</p>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(nextOtp)
                    toast({
                      title: "Next OTP Copied",
                      description: "Next OTP has been copied to clipboard",
                    })
                  }}
                >
                  Copy OTP
                </Button>
              </div>
            </div>
          )}
          <SecretManager />
        </CardContent>
      </Card>
    </div>
  )
}
