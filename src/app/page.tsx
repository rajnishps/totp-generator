import TotpView from "@/views/TotpView"
import { Suspense } from "react"

export default function Home() {
  return (
    <Suspense fallback={<></>}>
      <TotpView />
    </Suspense>
  )
}
