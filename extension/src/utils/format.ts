export const formatTimestamp = (value?: string) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const getHostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
