type ScreenshotItem = {
  src: string
  alt: string
  title: string
  caption: string
}

type ScreenshotGridProps = {
  items: ScreenshotItem[]
}

export function ScreenshotGrid({ items }: ScreenshotGridProps) {
  return (
    <div className="screenshot-grid">
      {items.map((item) => (
        <figure key={item.title} className="card screenshot-card">
          <img src={item.src} alt={item.alt} />
          <figcaption>
            <h3>{item.title}</h3>
            <p>{item.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
