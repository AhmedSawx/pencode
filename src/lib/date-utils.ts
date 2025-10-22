/**
 * Formats a date string to show relative time for recent dates
 * and absolute date for older dates
 */
export function formatLastModified(dateString?: string): string {
  if (!dateString) {
    return '2 days ago' // Default fallback
  }

  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()

  // Convert to different time units
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  // If more than a week old, show just the date
  if (diffInWeeks >= 1) {
    return date.toISOString().split('T')[0] // Returns yyyy-mm-dd format
  }

  // Show relative time for recent dates
  if (diffInDays >= 1) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  }

  if (diffInHours >= 1) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  }

  if (diffInMinutes >= 1) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`
  }

  return 'Just now'
}
