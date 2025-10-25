function List({ items, empty }: { items: string[]; empty: string }) {
  const has = items && items.length > 0
  if (!has) return <div className="text-sm text-gray-500">{empty}</div>
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )
}
