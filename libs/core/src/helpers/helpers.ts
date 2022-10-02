export function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

export function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s)?.groups
  if (!groups) return undefined
  return groups[groupName]
}
