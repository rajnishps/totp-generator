import React from "react"
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
  const link = authenticator.keyuri(email, issuer, secret)

  return (
    <div className="mx-auto">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={link}
        className=" flex w-fit justify-center rounded-xl bg-gray-100 p-4 shadow-small md:justify-start"
      >
        <QRCode value={link} size={160} />
      </a>
    </div>
  )
}

export default QRcodeView
