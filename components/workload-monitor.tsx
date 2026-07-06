'use client'

import { useMemo } from 'react'
import { useContentStore } from '@/lib/store'
import { calculateWorkload, getHighPriorityItems } from '@/lib/workload-utils'
import type { ContentItem } from '@/lib/types'

export function WorkloadMonitor() {
  const { items } = useContentStore()

  const workloadData = useMemo(() => calculateWorkload(items), [items])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overload':
        return 'bg-red-500/20 border-red-500'
      case 'caution':
        return 'bg-yellow-500/20 border-yellow-500'
      default:
        return 'bg-green-500/20 border-green-500'
    }
  }

  const getMemberStatus = (taskCount: number) => {
    if (taskCount > workloadData.maxWorkload * 0.7) return 'overload'
    if (taskCount > workloadData.avgWorkload) return 'caution'
    return 'normal'
  }

  const statusLabels = {
    overload: 'OVERLOAD',
    caution: 'CAUTION',
    normal: 'OK',
  }

  const statusColors = {
    overload: { bg: '#ff00ae', text: '#1c1c1c' },
    caution: { bg: '#0036ff', text: '#f2efe9' },
    normal: { bg: '#c1ff1a', text: '#1c1c1c' },
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#232323] border border-[#3a3a36] p-3 rounded">
          <p className="text-xs font-mono text-[#9a9a94] mb-1">TOTAL MEMBERS</p>
          <p className="text-2xl font-bold text-[#c1ff1a]">{workloadData.members.length}</p>
        </div>
        <div className="bg-[#232323] border border-[#3a3a36] p-3 rounded">
          <p className="text-xs font-mono text-[#9a9a94] mb-1">AVG WORKLOAD</p>
          <p className="text-2xl font-bold text-[#c1ff1a]">{workloadData.avgWorkload}</p>
        </div>
        <div className="bg-[#232323] border border-[#3a3a36] p-3 rounded">
          <p className="text-xs font-mono text-[#9a9a94] mb-1">OVERLOADED</p>
          <p className="text-2xl font-bold text-[#ff00ae]">{workloadData.overloadedMembers.length}</p>
        </div>
      </div>

      {/* Member List */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-[#9a9a94] uppercase tracking-wider">TEAM WORKLOAD</p>

        {workloadData.members.length === 0 ? (
          <div className="text-center py-8 text-[#9a9a94] text-sm">
            No team members assigned yet
          </div>
        ) : (
          <div className="space-y-2">
            {workloadData.members.map((member) => {
              const status = getMemberStatus(member.totalTasks)
              const statusColor = statusColors[status as keyof typeof statusColors]
              const percentage = workloadData.maxWorkload > 0 ? (member.totalTasks / workloadData.maxWorkload) * 100 : 0

              return (
                <div key={member.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-[#f2efe9] truncate">{member.name}</p>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs font-mono font-bold"
                      style={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                      }}
                    >
                      {statusLabels[status as keyof typeof statusLabels]}
                    </div>
                    <p className="text-sm font-mono text-[#9a9a94] w-8 text-right">{member.totalTasks}</p>
                  </div>

                  {/* Workload Bar */}
                  <div className="bg-[#232323] rounded overflow-hidden h-2 border border-[#3a3a36]">
                    <div
                      className={`h-full transition-all ${
                        status === 'overload'
                          ? 'bg-[#ff00ae]'
                          : status === 'caution'
                            ? 'bg-[#0036ff]'
                            : 'bg-[#c1ff1a]'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Status Breakdown */}
                  <div className="flex gap-1 flex-wrap text-xs">
                    {Object.entries(member.byStatus).map(([status, count]) => (
                      <span key={status} className="px-2 py-1 bg-[#232323] border border-[#3a3a36] rounded text-[#9a9a94]">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Overload Warning */}
      {workloadData.overloadedMembers.length > 0 && (
        <div className="bg-[#ff00ae]/10 border border-[#ff00ae] p-3 rounded">
          <p className="text-xs font-mono text-[#ff00ae] font-bold uppercase mb-2">⚠ OVERLOAD DETECTED</p>
          <ul className="text-sm space-y-1">
            {workloadData.overloadedMembers.map((member) => {
              const memberData = workloadData.members.find((m) => m.name === member)
              return (
                <li key={member} className="text-[#ff00ae]">
                  <strong>{member}</strong> has {memberData?.totalTasks} tasks ({Math.round((memberData?.totalTasks || 0) / workloadData.avgWorkload * 100)}% above average)
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-[#ff00ae] mt-2">Consider reassigning tasks to balance the workload.</p>
        </div>
      )}
    </div>
  )
}
