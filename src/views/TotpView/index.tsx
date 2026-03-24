"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Pause, Play } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { TOTP } from "totp-generator"
import UserMenu from "@/components/auth/UserMenu"
import QRcodeView from "./QRcodeView"
import { SecretManager } from "./SecretManager"

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
    searchParams.get("secret") || DEFAULT_SECRET,
  )
  const [digits, setDigits] = useState(
    Number(searchParams.get("digits")) || DEFAULT_DIGITS,
  )
  const [timePeriod, setTimePeriod] = useState(
    Number(searchParams.get("timePeriod")) || DEFAULT_TIME_PERIOD,
  )
  const [algorithm, setAlgorithm] = useState<AlgoType>(
    (searchParams.get("algorithm") as AlgoType) || DEFAULT_ALGORITHM,
  )
  const [name, setName] = useState(searchParams.get("name") || "")

  const [currentOtp, setCurrentOtp] = useState("")
  const [nextOtp, setNextOtp] = useState("")
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [secretsReady, setSecretsReady] = useState(false)

  useEffect(() => {
    const secret = searchParams.get("secret") || DEFAULT_SECRET
    const nameParam = searchParams.get("name") || ""
    const digitsParam = Number(searchParams.get("digits")) || DEFAULT_DIGITS
    const timePeriodParam =
      Number(searchParams.get("timePeriod")) || DEFAULT_TIME_PERIOD
    const algorithmParam =
      (searchParams.get("algorithm") as AlgoType) || DEFAULT_ALGORITHM

    setRawSecret(secret)
    setName(nameParam)
    setDigits(digitsParam)
    setTimePeriod(timePeriodParam)
    setAlgorithm(algorithmParam)
  }, [searchParams])

  useEffect(() => {
    const updateParams = () => {
      router.push(
        `?secret=${rawSecret}&name=${name}&digits=${digits}&timePeriod=${timePeriod}&algorithm=${algorithm}`,
      )
    }

    updateParams()
  }, [digits, rawSecret, timePeriod, algorithm, router])

  const handleGenerateOtp = useCallback(async () => {
    const currentTimeInMiliSeconds = Math.floor(Date.now() / 1)

    const currentRes = await TOTP.generate(rawSecret, {
      digits,
      algorithm,
      timestamp: currentTimeInMiliSeconds,
      period: timePeriod,
    })

    const nextRes = await TOTP.generate(rawSecret, {
      digits,
      algorithm,
      timestamp: currentTimeInMiliSeconds + timePeriod * 1000,
      period: timePeriod,
    })

    setCurrentOtp(currentRes.otp)
    setNextOtp(nextRes.otp)

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

  useEffect(() => {
    if (navigator && currentOtp && !isPaused && secretsReady) {
      navigator.clipboard.writeText(currentOtp)
      toast({
        title: `OTP Copied ${currentOtp}`,
        description: "Current OTP has been copied to clipboard",
      })
    }
  }, [currentOtp, isPaused, secretsReady])

  return (
    <div className="h-screen bg-black text-white md:overflow-clip font-sans">
      <div className="container mx-auto p-4 md:p-8 h-screen flex flex-col">
        <header className="flex justify-between items-center mb-2 shrink-0 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic truncate">
              Next TOTP
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase truncate">
              Secure Offline Vault
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 transition-all duration-300 text-xs h-8 md:h-10"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              ) : (
                <Pause className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              )}
              <span className="xs:inline">
                {isPaused ? "Resume" : "Pause"} Auto-copy
              </span>
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Main Display Area */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-2 lg:overflow-y-auto lg:h-[calc(100vh-4rem)] pr-2 custom-scrollbar">
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group border-opacity-50 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="text-lg font-bold text-blue-400  tracking-widest  opacity-80">
                      {name || "Session Key"}
                    </span>
                    <span className="text-lg font-mono text-zinc-400 uppercase break-all leading-relaxed">
                      {rawSecret}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-2 md:py-8">
                <div className="relative mb-4">
                  <div className="absolute -inset-8 bg-blue-500/10 blur-[60px] rounded-full animate-pulse" />
                  <QRcodeView secret={rawSecret} />
                </div>

                <div
                  onClick={() => {
                    navigator.clipboard.writeText(currentOtp)
                    toast({
                      title: "Copied!",
                      description: "OTP copied to clipboard",
                    })
                  }}
                  className="cursor-pointer w-full max-w-md space-y-8 md:space-y-10"
                >
                  <div className="text-center space-y-4">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
                      Current Token
                    </p>
                    <div className="flex items-center justify-center gap-4 md:gap-6 group/otp">
                      <span className="text-5xl xs:text-6xl md:text-8xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                        {currentOtp.slice(0, 3) + " " + currentOtp.slice(3)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-600 tracking-tighter">
                      <span>KEY ROTATION</span>
                      <span>
                        {Math.round(timePeriod * (1 - progress / 100))}S
                        REMAINING
                      </span>
                    </div>
                    <Progress
                      indicatorClassName={cn(
                        "transition-all duration-1000 ease-linear",
                        progress < 60
                          ? "bg-blue-600"
                          : progress < 85
                            ? "bg-amber-600"
                            : "bg-rose-600",
                      )}
                      value={100 - progress}
                      className="h-1.5 bg-zinc-950 rounded-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-sm border-opacity-50 shrink-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Next Token
                  </CardTitle>
                </CardHeader>
                <CardContent
                  onClick={() => {
                    navigator.clipboard.writeText(nextOtp)
                    toast({
                      title: "Next OTP Copied!",
                      description: "Next OTP has been copied to clipboard",
                    })
                  }}
                  className="cursor-pointer flex items-center justify-between pt-2"
                >
                  <span className="text-2xl md:text-3xl font-black tabular-nums text-zinc-300 tracking-tight">
                    {nextOtp.slice(0, 3)} {nextOtp.slice(3)}
                  </span>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-sm border-opacity-50 shrink-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 pt-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-zinc-600 block uppercase">
                      Length
                    </span>
                    <span className="text-base md:text-lg font-black text-zinc-400">
                      {digits}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-zinc-600 block uppercase">
                      Period
                    </span>
                    <span className="text-base md:text-lg font-black text-zinc-400">
                      {timePeriod}s
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-zinc-600 block uppercase">
                      Algo
                    </span>
                    <span className="text-base md:text-lg font-black text-zinc-400 truncate">
                      {algorithm.split("-")[1] || algorithm}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex flex-col min-h-0 shadow-xl border-opacity-50 lg:h-[calc(100vh-11rem)]">
              <CardContent className="pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4 pt-4 border-t border-zinc-800/30">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    Stored Access Keys
                  </h3>
                  <SecretManager onReady={() => setSecretsReady(true)} />
                </div>
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    Global Configuration
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-left block">
                        Cryptographic Algorithm
                      </Label>
                      <Select
                        value={algorithm}
                        onValueChange={(value) =>
                          setAlgorithm(value as AlgoType)
                        }
                      >
                        <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                          <SelectItem value="SHA-1">SHA-1 (Legacy)</SelectItem>
                          <SelectItem value="SHA-256">
                            SHA-256 (Modern)
                          </SelectItem>
                          <SelectItem value="SHA-512">
                            SHA-512 (Secure)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-left block">
                          Digit Length
                        </Label>
                        <Select
                          value={digits.toString()}
                          onValueChange={(value) => setDigits(parseInt(value))}
                        >
                          <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <SelectItem value="6">6 Digits</SelectItem>
                            <SelectItem value="8">8 Digits</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-left block">
                          Sync Interval
                        </Label>
                        <Select
                          value={timePeriod.toString()}
                          onValueChange={(value) =>
                            setTimePeriod(parseInt(value))
                          }
                        >
                          <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <SelectItem value="30">30 Seconds</SelectItem>
                            <SelectItem value="60">60 Seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        @media (max-width: 640px) {
          .xs\\:hidden {
            display: none;
          }
          .xs\\:inline {
            display: inline;
          }
        }
      `}</style>
    </div>
  )
}
