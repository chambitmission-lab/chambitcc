/** datetime-local(로컬 시각) 문자열 → ISO. 비어 있으면 null */
export const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null)
