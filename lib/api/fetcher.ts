export const apiFetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}
