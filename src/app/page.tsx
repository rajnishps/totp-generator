import { auth } from "@/lib/auth"
import TotpView from "@/views/TotpView"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default async function Home() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <Suspense fallback={<></>}>
      <TotpView />
    </Suspense>
  )
}
