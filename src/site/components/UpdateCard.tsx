type UpdateCardProps = {
  title: string
  date: string
  summary: string
}

export function UpdateCard({ title, date, summary }: UpdateCardProps) {
  return (
    <article className="card update-card">
      <p className="update-card__date">{date}</p>
      <h3>{title}</h3>
      <p>{summary}</p>
    </article>
  )
}
