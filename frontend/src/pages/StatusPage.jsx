import { UAOS_PUBLIC } from '../services/publicLinks'

export default function StatusPage() {
  const checks = [
    ['Website', UAOS_PUBLIC.website],
    ['Pricing', UAOS_PUBLIC.pricing],
    ['Starter PayPal', UAOS_PUBLIC.starter],
    ['Pro PayPal', UAOS_PUBLIC.pro]
  ]

  return (
    <main style={{ minHeight: '100vh', padding: 48, background: '#080a0e', color: 'white' }}>
      <h1>UAOS Public Status</h1>
      <p>Universal Arranger OS public launch links and readiness status.</p>

      <section style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        {checks.map(([label, url]) => (
          <article key={label} style={{ border: '1px solid #333', borderRadius: 14, padding: 18 }}>
            <h2>{label}</h2>
            <a href={url} target="_blank" rel="noreferrer" style={{ color: '#ffd166' }}>
              {url}
            </a>
          </article>
        ))}
      </section>
    </main>
  )
}
