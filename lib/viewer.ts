// Bukan sistem login beneran — cuma nanya nama sekali, disimpen di browser lokal,
// dipake buat label presence ("sedang dilihat oleh X") & default approver.
const KEY = 'ccc_viewer_name'

export function getViewerName(): string {
  if (typeof window === 'undefined') return 'Someone'
  let name = window.localStorage.getItem(KEY)
  if (!name) {
    name = window.prompt('Nama kamu (biar kelihatan tim yang lain)?')?.trim() || 'Anonim'
    window.localStorage.setItem(KEY, name)
  }
  return name
}
