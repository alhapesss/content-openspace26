import type { ContentItem } from './types'
import { STATUSES } from './constants'

export interface MemberWorkload {
  name: string
  totalTasks: number
  byStatus: Record<string, number>
  byRole: Record<string, number>
}

export interface WorkloadStats {
  members: MemberWorkload[]
  maxWorkload: number
  avgWorkload: number
  overloadedMembers: string[]
}

// Extract all unique PIC assignments across all roles
function extractPICs(item: ContentItem): Record<string, string> {
  return {
    pic: item.pic,
    picGraphic: item.picGraphic,
    picVideoEditor: item.picVideoEditor,
    picTalent: item.picTalent,
    picVideographer: item.picVideographer,
  }
}

function getRoleLabel(field: string): string {
  const roleMap: Record<string, string> = {
    pic: 'General',
    picGraphic: 'Graphic Design',
    picVideoEditor: 'Video Editor',
    picTalent: 'Talent',
    picVideographer: 'Videographer',
  }
  return roleMap[field] || field
}

export function calculateWorkload(items: ContentItem[]): WorkloadStats {
  const memberMap = new Map<string, MemberWorkload>()

  // Process each item
  items.forEach((item) => {
    const pics = extractPICs(item)

    // For each role assignment
    Object.entries(pics).forEach(([role, memberName]) => {
      if (!memberName || memberName === '—pilih—' || memberName.trim() === '') return

      if (!memberMap.has(memberName)) {
        memberMap.set(memberName, {
          name: memberName,
          totalTasks: 0,
          byStatus: {},
          byRole: {},
        })
      }

      const member = memberMap.get(memberName)!
      member.totalTasks += 1

      // Count by status
      if (!member.byStatus[item.status]) {
        member.byStatus[item.status] = 0
      }
      member.byStatus[item.status] += 1

      // Count by role
      const roleLabel = getRoleLabel(role)
      if (!member.byRole[roleLabel]) {
        member.byRole[roleLabel] = 0
      }
      member.byRole[roleLabel] += 1
    })
  })

  const members = Array.from(memberMap.values()).sort(
    (a, b) => b.totalTasks - a.totalTasks
  )

  const workloads = members.map((m) => m.totalTasks)
  const maxWorkload = Math.max(...workloads, 0)
  const avgWorkload = workloads.length > 0 ? Math.round(workloads.reduce((a, b) => a + b) / workloads.length) : 0

  // Members with > 1.5x average workload are overloaded
  const overloadedThreshold = avgWorkload * 1.5
  const overloadedMembers = members
    .filter((m) => m.totalTasks > overloadedThreshold)
    .map((m) => m.name)

  return {
    members,
    maxWorkload,
    avgWorkload,
    overloadedMembers,
  }
}

// Identify high-priority items that need reassignment
export function getHighPriorityItems(items: ContentItem[], memberName: string): ContentItem[] {
  return items.filter((item) => {
    const pics = extractPICs(item)
    const isAssigned = Object.values(pics).includes(memberName)
    return isAssigned && (item.status === 'Review' || item.status === 'Terjadwal')
  })
}

// Get members sorted by workload
export function getMembersByWorkload(items: ContentItem[]): Array<{ name: string; count: number; status: 'normal' | 'caution' | 'overload' }> {
  const { members, avgWorkload, overloadedMembers } = calculateWorkload(items)

  return members.map((m) => {
    let status: 'normal' | 'caution' | 'overload' = 'normal'
    if (overloadedMembers.includes(m.name)) {
      status = 'overload'
    } else if (m.totalTasks > avgWorkload) {
      status = 'caution'
    }

    return {
      name: m.name,
      count: m.totalTasks,
      status,
    }
  })
}
