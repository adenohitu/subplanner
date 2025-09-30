import type { Subscription, BillingCycle } from '@/types/subscription'

/**
 * Export subscriptions to CSV file
 */
export function exportSubscriptionsToCSV(subscriptions: Subscription[]): void {
  // CSV header
  const headers = ['id', 'name', 'price', 'billingCycle', 'nextBillingDate', 'category', 'color']

  // CSV rows
  const rows = subscriptions.map(sub => [
    sub.id,
    escapeCSVField(sub.name),
    sub.price.toString(),
    sub.billingCycle,
    sub.nextBillingDate,
    escapeCSVField(sub.category || ''),
    escapeCSVField(sub.color || '')
  ])

  // Combine header and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  link.setAttribute('href', url)
  link.setAttribute('download', `subscriptions_${date}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Parse CSV string to subscriptions array
 */
export function parseCSVToSubscriptions(csvText: string): {
  subscriptions: Subscription[]
  errors: string[]
} {
  const lines = csvText.trim().split('\n')
  const errors: string[] = []
  const subscriptions: Subscription[] = []

  if (lines.length < 2) {
    errors.push('CSVファイルが空か、ヘッダー行のみです')
    return { subscriptions, errors }
  }

  // Parse header
  const headers = parseCSVLine(lines[0])

  // Validate headers (flexible order)
  const headerMap = new Map<string, number>()
  headers.forEach((header, index) => {
    headerMap.set(header.toLowerCase().trim(), index)
  })

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)

      const id = getValueByHeader(values, headerMap, 'id')
      const name = getValueByHeader(values, headerMap, 'name')
      const priceStr = getValueByHeader(values, headerMap, 'price')
      const billingCycle = getValueByHeader(values, headerMap, 'billingcycle')
      const nextBillingDate = getValueByHeader(values, headerMap, 'nextbillingdate')
      const category = getValueByHeader(values, headerMap, 'category')
      const color = getValueByHeader(values, headerMap, 'color')

      // Validate required fields
      if (!id || !name || !priceStr || !billingCycle || !nextBillingDate) {
        errors.push(`行${i + 1}: 必須フィールドが不足しています`)
        continue
      }

      const price = parseFloat(priceStr)
      if (isNaN(price) || price < 0) {
        errors.push(`行${i + 1}: 価格が不正です (${priceStr})`)
        continue
      }

      if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
        errors.push(`行${i + 1}: billingCycleは'monthly'または'yearly'である必要があります (${billingCycle})`)
        continue
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextBillingDate)) {
        errors.push(`行${i + 1}: 日付形式が不正です。YYYY-MM-DD形式で指定してください (${nextBillingDate})`)
        continue
      }

      subscriptions.push({
        id,
        name,
        price,
        billingCycle: billingCycle as BillingCycle,
        nextBillingDate,
        category: category || undefined,
        color: color || undefined
      })
    } catch (error) {
      errors.push(`行${i + 1}: パースエラー - ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  return { subscriptions, errors }
}

/**
 * Escape CSV field (handle commas and quotes)
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(currentField)
      currentField = ''
    } else {
      currentField += char
    }
  }

  // Add last field
  result.push(currentField)

  return result
}

/**
 * Get value from CSV row by header name
 */
function getValueByHeader(
  values: string[],
  headerMap: Map<string, number>,
  headerName: string
): string {
  const index = headerMap.get(headerName.toLowerCase())
  if (index === undefined) return ''
  return values[index]?.trim() || ''
}