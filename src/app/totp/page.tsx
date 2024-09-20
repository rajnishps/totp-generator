import TotpView from "@/views/TotpView"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<></>}>
      <TotpView />
    </Suspense>
  )
}
