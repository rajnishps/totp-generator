import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secrets = await prisma.secret.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      encryptedSecret: true,
      iv: true,
      salt: true,
    },
  })

  return NextResponse.json(secrets)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, encryptedSecret, iv, salt } = body

  if (!encryptedSecret || !iv || !salt) {
    return NextResponse.json(
      { error: "Missing encrypted data" },
      { status: 400 },
    )
  }

  const secret = await prisma.secret.create({
    data: {
      userId: session.user.id,
      name: name || "Untitled",
      encryptedSecret,
      iv,
      salt,
    },
    select: {
      id: true,
      name: true,
      encryptedSecret: true,
      iv: true,
      salt: true,
    },
  })

  return NextResponse.json(secret, { status: 201 })
}
