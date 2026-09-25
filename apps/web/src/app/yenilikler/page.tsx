import { formatDate, getMessages } from '@havayolu/i18n'
import { CHANGELOG, currentVersion, pickText } from '@havayolu/shared'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(await getLocale()).changelog.title }
}

export default async function ChangelogPage() {
  const locale = await getLocale()
  const t = getMessages(locale).changelog
  const latest = currentVersion()

  return (
    <article className="page">
      <h1>{t.title}</h1>
      <p className="lead">{t.intro}</p>
      <ol className="releases">
        {CHANGELOG.map((entry) => (
          <li key={entry.version} className="release" id={`v${entry.version}`}>
            <header className="release-header">
              <h2>
                <span className="mono">v{entry.version}</span> {pickText(entry.title, locale)}
              </h2>
              <p className="release-meta">
                <time dateTime={entry.date}>
                  {t.released}: {formatDate(entry.date, locale)}
                </time>
                {entry.version === latest ? (
                  <span className="state state-current">{t.current}</span>
                ) : null}
              </p>
            </header>
            <ul className="release-items">
              {entry.items.map((item) => (
                <li key={item.tr}>{pickText(item, locale)}</li>
              ))}
            </ul>
            {entry.tryLinks?.length ? (
              <p className="try-links">
                {entry.tryLinks.map((link) => (
                  <Link key={link.path} href={link.path} className="try-link">
                    {t.tryIt}: {pickText(link.label, locale)} →
                  </Link>
                ))}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  )
}
