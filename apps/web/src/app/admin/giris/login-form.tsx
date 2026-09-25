'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '../actions'

export interface LoginFormLabels {
  email: string
  password: string
  submit: string
  errors: Record<NonNullable<LoginState['error']>, string>
}

export function LoginForm({ labels }: { labels: LoginFormLabels }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {
    error: null,
  })
  return (
    <form action={action} className="form">
      <label className="field">
        <span>{labels.email}</span>
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>{labels.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </label>
      {state.error ? (
        <p role="alert" className="form-error">
          {labels.errors[state.error]}
        </p>
      ) : null}
      <button type="submit" className="button" disabled={pending}>
        {labels.submit}
      </button>
    </form>
  )
}
