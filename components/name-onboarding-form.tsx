"use client"

import { useActionState, useEffect, useState } from "react"
import { updateDisplayName } from "@/app/onboarding/name/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, User } from "lucide-react"

export default function NameOnboardingForm({ currentName }: { currentName?: string | null }) {
  const [state, formAction, isPending] = useActionState(updateDisplayName, undefined)
  const [displayName, setDisplayName] = useState(currentName || "")

  useEffect(() => {
    if (state?.success) {
      // Redirect is handled by the server action
    }
  }, [state])

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <User className="mx-auto h-12 w-12 text-[#007AFF]" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">👋 Hi! I’m your General Agent.</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">What should I call you?</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="displayName" className="sr-only">
            Your Name
          </Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="e.g., Alex Smith"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            className="mt-1 text-center text-lg"
            aria-describedby="name-error"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[#007AFF] hover:bg-[#0056b3] text-white text-lg py-3"
          disabled={isPending || !displayName.trim()}
        >
          {isPending ? "Saving..." : "Continue"}
        </Button>
      </form>

      {state?.error && (
        <Alert variant="destructive" id="name-error">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Oops!</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.message && !state.error && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-700">
          <Terminal className="h-4 w-4 !text-green-700" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
