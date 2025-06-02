"use client"

import { useState, useTransition } from "react"

export function useActionState<T, U>(action: (formData: FormData) => Promise<T>, initialState?: U) {
  const [state, setState] = useState<U | undefined>(initialState)
  const [isPending, startTransition] = useTransition()

  const formAction = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await action(formData)
        setState(result as unknown as U)
      } catch (error) {
        console.error("Action error:", error)
      }
    })
  }

  return [state, formAction, isPending] as const
}
