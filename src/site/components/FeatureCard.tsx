type FeatureCardProps = {
  title: string
  body: string
}

export function FeatureCard({ title, body }: FeatureCardProps) {
  return (
    <article className="card feature-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}
