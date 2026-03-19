import type { Route } from '../router'
import { CTAButton } from './CTAButton'

type HeroSectionProps = {
  eyebrow: string
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
  media: { src: string; alt: string }
  navigate: (route: Route) => void
}

export function HeroSection({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  media,
  navigate,
}: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="hero-section__copy card">
        <p className="hero-section__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-section__description">{description}</p>
        <div className="hero-section__actions">
          <CTAButton label={primaryCta.label} href={primaryCta.href} navigate={navigate} size="large" />
          <CTAButton
            label={secondaryCta.label}
            href={secondaryCta.href}
            navigate={navigate}
            variant="secondary"
            size="large"
            target="_blank"
            rel="noreferrer"
          />
        </div>
      </div>
      <div className="hero-section__media card">
        <img src={media.src} alt={media.alt} />
      </div>
    </section>
  )
}
