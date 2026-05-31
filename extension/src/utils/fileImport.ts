const urlPattern = /https?:\/\/[^\s,]+/gi

export const extractUrlsFromText = (input: string): string[] => {
  const matches = input.match(urlPattern) ?? []
  return Array.from(new Set(matches.map((item) => item.trim()))).filter(Boolean)
}

export const extractUrlsFromFile = async (file: File): Promise<string[]> => {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const urls = new Set<string>()

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
    rows.forEach((row) => {
      row.forEach((cell) => {
        if (typeof cell === 'string') {
          extractUrlsFromText(cell).forEach((url) => urls.add(url))
        }
      })
    })
  })

  return Array.from(urls)
}

export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
