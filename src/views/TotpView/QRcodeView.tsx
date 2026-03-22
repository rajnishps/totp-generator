import { Button } from "@/components/ui/button"
import { Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authenticator } from "otplib"
import QRCode from "qrcode.react"

const QRcodeView = ({
  secret,
  email = "user",
  issuer = "issuer",
}: {
  secret: string
  email?: string
  issuer?: string
}) => {
  const { toast } = useToast()
  const link = authenticator.keyuri(email, issuer, secret)

  const handleExport = () => {
    const storedSecrets = localStorage.getItem("secrets")
    if (storedSecrets) {
      navigator.clipboard.writeText(storedSecrets)
      toast({
        title: "Secrets Exported",
        description: "All secrets have been copied to clipboard as JSON",
      })
    } else {
      toast({
        variant: "destructive",
        title: "No Secrets Found",
        description: "There are no secrets to export.",
      })
    }
  }

  return (
    <div className="mx-auto relative group">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={link}
        className=" flex w-fit justify-center rounded-xl bg-white p-4 shadow-sm md:justify-start"
      >
        <QRCode value={link} size={160} />
      </a>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 text-black"
        onClick={handleExport}
      >
        <Share className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default QRcodeView
