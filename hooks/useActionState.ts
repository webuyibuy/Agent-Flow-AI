"use client"

import { useState, useTransition } from "react"

export interface ActionState<T = any> {
  data?: T
  error?: string
  success?: boolean
}

export function useActionState<T = any>(
  action: (formData: FormData) => Promise<ActionState<T>>,
  initialState?: ActionState<T>,
): [ActionState<T>, (formData: FormData) => void, boolean] {
  const [state, setState] = useState<ActionState<T>>(initialState || {})
  const [isPending, startTransition] = useTransition()

  const formAction = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await action(formData)
        setState(result)
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : "An error occurred",
          success: false,
        })
      }
    })
  }

  return [state, formAction, isPending]
}
