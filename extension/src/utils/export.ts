import type { ResultRow, TemplateField } from '../types'

export const copyRowsToClipboard = async (rows: ResultRow[]) => {
  const text = JSON.stringify(rows, null, 2)
  await navigator.clipboard.writeText(text)
}

export const downloadRowsAsCsv = (fields: TemplateField[], rows: ResultRow[], filename: string) => {
  const header = fields.map((field) => escapeCell(field.label)).join(',')
  const lines = rows.map((row) => fields.map((field) => escapeCell(String(row[field.key] ?? ''))).join(','))
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export const downloadPlainText = (lines: string[], filename: string) => {
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
