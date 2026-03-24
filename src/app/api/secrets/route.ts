import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encryptSecret, decryptSecret } from "@/lib/crypto"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await prisma.secret.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, encryptedSecret: true, iv: true },
  })

  const decrypted = rows.map((row) => {
    try {
      const secret = decryptSecret(row.encryptedSecret, row.iv, session.user!.id!)
      return { id: row.id, name: row.name, secret }
    } catch {
      return { id: row.id, name: row.name, secret: "⚠️ DECRYPT ERROR" }
    }
  })

  return NextResponse.json(decrypted)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, secret } = body

  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 })
  }

  const { ciphertext, iv } = encryptSecret(secret, session.user.id)

  const row = await prisma.secret.create({
    data: {
      userId: session.user.id,
      name: name || "Untitled",
      encryptedSecret: ciphertext,
      iv,
      salt: "", // unused — key is derived from HASH_SECRET + userId
    },
    select: { id: true, name: true },
  })

  return NextResponse.json({ id: row.id, name: row.name, secret }, { status: 201 })
}
