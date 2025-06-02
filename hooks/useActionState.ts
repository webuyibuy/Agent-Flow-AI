"use client"

import { useState, useTransition } from "react"

type ActionState<T> = {
  data?: T
  error?: string
  success?: boolean
}

export function useActionState<T, P>(
  action: (prevState: ActionState<T>, formData: P) => Promise<ActionState<T>>,
  initialState: ActionState<T>,
): [ActionState<T>, (formData: P) => void, boolean] {
  const [state, setState] = useState<ActionState<T>>(initialState)
  const [isPending, startTransition] = useTransition()

  const formAction = (formData: P) => {
    startTransition(async () => {
      try {
        const result = await action(state, formData)
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
