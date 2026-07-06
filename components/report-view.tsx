'use client'

import { useContentStore } from '@/lib/store'
import { PLATFORMS } from '@/lib/constants'
import { engagementOf, engagementRateOf } from '@/lib/content-utils'

export function ReportView() {
  const { items, accounts } = useContentStore()
  const published = items.filter((i) => i.status === 'Publish')

  const totalViews = published.reduce((s, i) => s + (Number(i.views) || 0), 0)
  const totalEngagement = published.reduce((s, i) => s + engagementOf(i), 0)
  const avgRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

  const relevantPlatforms = PLATFORMS.filter(
    (p) => accounts[p] || items.some((i) => i.platform === p)
  )

  // Workload
  const active = items.filter((i) => i.status !== 'Publish' && i.picGraphic)
  const workloadCounts: Record<string, number> = {}
  active.forEach((i) => { workloadCounts[i.picGraphic] = (workloadCounts[i.picGraphic] || 0) + 1 })
  const maxWork = Math.max(...Object.values(workloadCounts), 1)
  const workloadEntries = Object.entries(workloadCounts).sort((a, b) => b[1] - a[1])
  const OVERLOAD_AT = 4

  return (
    <div>
      {/* Global stats */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {[
          { n: published.length, l: 'Total Konten Publish' },
          { n: totalViews.toLocaleString('id-ID'), l: 'Total Views/Reach' },
          { n: totalEngagement.toLocaleString('id-ID'), l: 'Total Engagement' },
          { n: `${avgRate.toFixed(1)}%`, l: 'Avg Engagement Rate' },
        ].map((s) => (
          <div key={s.l} className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 min-w-[120px]">
            <div className="text-[22px] font-extrabold">{s.n}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Workload */}
      {workloadEntries.length > 0 && (
        <details open className="border border-[#3a3a36] rounded-md px-4 py-3.5 mb-3.5">
          <summary className="cursor-pointer font-mono text-[13px] uppercase tracking-wider mb-3 text-[#f2efe9]">
            Workload Graphic Design (konten belum Publish)
          </summary>
          {workloadEntries.map(([name, count]) => {
            const pct = Math.round((count / maxWork) * 100)
            const isOverload = count >= OVERLOAD_AT
            return (
              <div key={name} className="flex items-center gap-2.5 mb-2 text-xs">
                <div className="w-[110px] shrink-0 font-mono text-[10px] uppercase text-[#9a9a94] truncate">{name}</div>
                <div className="flex-1 h-4 bg-[#232323] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{ width: `${pct}%`, background: isOverload ? '#ff00ae' : '#c1ff1a' }}
                  />
                </div>
                <div className="w-[90px] text-right font-mono text-[11px] shrink-0" style={{ color: isOverload ? '#ff00ae' : '#f2efe9' }}>
                  {count} konten{isOverload ? ' ⚠' : ''}
                </div>
              </div>
            )
          })}
        </details>
      )}

      {/* Per-platform blocks */}
      {relevantPlatforms.map((platform) => {
        const acc = accounts[platform]
        const hist = acc?.history || []
        const growth = hist.length > 1 ? hist[hist.length - 1].followers - hist[0].followers : 0
        const pubP = published.filter((i) => i.platform === platform)
        const pViews = pubP.reduce((s, i) => s + (Number(i.views) || 0), 0)
        const pEng = pubP.reduce((s, i) => s + engagementOf(i), 0)
        const pRate = pViews > 0 ? (pEng / pViews) * 100 : 0
        const top = [...pubP].sort((a, b) => engagementOf(b) - engagementOf(a)).slice(0, 5)

        return (
          <details key={platform} open className="border border-[#3a3a36] rounded-md px-4 py-3.5 mb-3.5">
            <summary className="cursor-pointer font-mono text-[13px] uppercase tracking-wider mb-3 text-[#f2efe9]">
              {platform}
            </summary>

            {acc && (
              <div className="flex flex-wrap gap-2.5 mb-3">
                <div className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 min-w-[120px]">
                  <div className="text-[22px] font-extrabold">{(acc.followers || 0).toLocaleString('id-ID')}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">Followers</div>
                  {hist.length > 1 && (
                    <div
                      className="font-mono text-[11px] mt-1"
                      style={{ color: growth > 0 ? '#c1ff1a' : growth < 0 ? '#ff00ae' : '#9a9a94' }}
                    >
                      {growth > 0 ? '+' : ''}{growth.toLocaleString('id-ID')} sejak {hist[0].date}
                    </div>
                  )}
                </div>
                <div className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 min-w-[120px]">
                  <div className="text-[22px] font-extrabold">{(acc.following || 0).toLocaleString('id-ID')}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">Following</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mb-3">
              {[
                { n: pubP.length, l: 'Konten Publish' },
                { n: pViews.toLocaleString('id-ID'), l: 'Views/Reach' },
                { n: pEng.toLocaleString('id-ID'), l: 'Engagement' },
                { n: `${pRate.toFixed(1)}%`, l: 'Eng. Rate' },
              ].map((s) => (
                <div key={s.l} className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 min-w-[100px]">
                  <div className="text-[22px] font-extrabold">{s.n}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">{s.l}</div>
                </div>
              ))}
            </div>

            {top.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {['Judul', 'Format', 'Views', 'Engagement', 'Eng. Rate'].map((h) => (
                        <th key={h} className="text-left font-mono text-[10px] uppercase text-[#9a9a94] tracking-wider px-2 py-1.5 border-b border-[#3a3a36]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((item) => (
                      <tr key={item.id} className="hover:bg-[#232323] transition-colors">
                        <td className="px-2 py-1.5 border-b border-[#3a3a36] text-[#f2efe9]">{item.title}</td>
                        <td className="px-2 py-1.5 border-b border-[#3a3a36] text-[#9a9a94]">{item.format}</td>
                        <td className="px-2 py-1.5 border-b border-[#3a3a36] font-mono">{(Number(item.views) || 0).toLocaleString('id-ID')}</td>
                        <td className="px-2 py-1.5 border-b border-[#3a3a36] font-mono">{engagementOf(item).toLocaleString('id-ID')}</td>
                        <td className="px-2 py-1.5 border-b border-[#3a3a36] font-mono">{engagementRateOf(item).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#9a9a94] py-2">Belum ada konten publish di {platform}.</p>
            )}
          </details>
        )
      })}

      {relevantPlatforms.length === 0 && (
        <p className="text-sm text-[#9a9a94] py-6 text-center">Belum ada konten atau data akun.</p>
      )}
    </div>
  )
}
