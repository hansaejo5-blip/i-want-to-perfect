type FAQItem = {
  question: string
  answer: string
}

type FAQSectionProps = {
  items: FAQItem[]
}

export function FAQSection({ items }: FAQSectionProps) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.question} className="card faq-item">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
