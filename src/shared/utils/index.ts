export const getErrorReason = (error: unknown): string => {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'request timed out'
  }

  return error instanceof Error ? error.message : String(error)
}

export const isEnumValue = <T extends string>(value: string, enumType: Record<string, T>): value is T =>
  Object.values(enumType).some((option) => option === value)
