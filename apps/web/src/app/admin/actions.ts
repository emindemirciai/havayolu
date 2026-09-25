'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  loginToApi,
  logoutFromApi,
  type LoginFailure,
} from '@/lib/admin-api'
import { getServerEnv } from '@/lib/env'

export interface LoginState {
  error: LoginFailure | null
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'invalid' }

  const result = await loginToApi(email, password)
  if (!result.ok) return { error: result.reason }

  const store = await cookies()
  store.set(ADMIN_COOKIE, result.token, {
    httpOnly: true,
    secure: getServerEnv().APP_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (token) await logoutFromApi(token)
  store.delete({ name: ADMIN_COOKIE, path: '/admin' })
  redirect('/admin/giris')
}
