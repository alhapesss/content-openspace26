export interface TeamMember {
  id?: string // diisi otomatis pas sync ke Supabase
  name: string
  role: string
  phone?: string // nomor WA, format bebas (misal 08123456789 atau +6281234567890)
}

export interface ContentItem {
  id: string
  title: string
  format: string
  subformat: string
  pillar: string
  status: string
  date: string
  deadline?: string // tanggal deadline produksi (sebelum publish)
  shootDate: string
  shootLocation: string
  pic: string
  picGraphic: string
  picVideoEditor: string
  picTalent: string
  picVideographer: string
  platform: string
  script: string
  scripts?: string[] // untuk carousel - script per slide
  assets: string
  driveLink?: string // link google drive hasil konten/design
  briefPosting?: string
  caption: string
  notes: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  createdAt: number
  // Objective & metrics tambahan (sesuai Social Media Metrics Guideline)
  objective?: 'Awareness' | 'Engagement' | 'Conversion'
  reach?: number
  impressions?: number
  brandMentions?: number
  clicks?: number
  leads?: number
  metricsUpdatedAt?: number
  // Approval workflow
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: number
  rejectionReason?: string
  // Archive (auto/manual, konten Publish lama disembunyiin dari board)
  archived?: boolean
  archivedAt?: number
  // Google Calendar sync (event id, biar update bukan bikin duplikat)
  googleEventId?: string
  googleEventIdDeadline?: string
}

export interface AccountData {
  followers: number
  following: number
  history: Array<{ date: string; followers: number; following: number }>
}

export type AccountsMap = Record<string, AccountData>

// Notifications & Reminders
export interface Notification {
  id: string
  type: 'deadline' | 'status_change' | 'team_mention' | 'custom' | 'approval_needed' | 'approval_result'
  title: string
  message: string
  contentId?: string
  read: boolean
  createdAt: number
  targetDate?: string
}

export interface Reminder {
  id: string
  contentId: string
  daysBeforeDeadline: number
  enabled: boolean
}

// Collaboration
export interface Comment {
  id: string
  contentId: string
  authorId: string
  text: string
  createdAt: number
  threadId?: string
  reactions?: Record<string, string> // viewerName -> emoji (1 reaksi per orang per komentar)
}

export interface Activity {
  id: string
  type: 'created' | 'updated' | 'status_changed' | 'commented' | 'approved' | 'rejected'
  contentId: string
  actorId: string
  field?: string
  oldValue?: string
  newValue?: string
  createdAt: number
}

// Reporting
export interface Report {
  id: string
  name: string
  type: 'engagement' | 'workload' | 'timeline' | 'roi'
  dateRange: [string, string]
  filters: {
    statuses?: string[]
    platforms?: string[]
    formats?: string[]
    pillars?: string[]
    team?: string[]
  }
  metrics: string[]
  createdAt: number
  lastModified: number
}

// Search & Filtering
export interface SearchFilter {
  query: string
  statuses: string[]
  platforms: string[]
  formats: string[]
  pillars: string[]
  team: string[]
  dateRange?: [string, string]
  engagementRange?: [number, number]
}
