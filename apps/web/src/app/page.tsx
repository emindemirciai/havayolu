import { redirect } from 'next/navigation'

/** Canlı harita gelene kadar kök adres Durum sayfasına yönlenir. */
export default function Home() {
  redirect('/durum')
}
