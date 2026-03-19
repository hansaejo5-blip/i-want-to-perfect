type SectionTitleProps = {
  title: string
  eyebrow?: string
}

export function SectionTitle({ title, eyebrow }: SectionTitleProps) {
  return (
    <div className="section-title">
      {eyebrow ? <p className="section-title__eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
    </div>
  )
}
