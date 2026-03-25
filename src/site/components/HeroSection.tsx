import type { Route } from '../router'
import { CTAButton } from './CTAButton'

type HeroSectionProps = {
  eyebrow: string
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
  supportNote: string
  quickFacts: string[]
  media: { src: string; alt: string }
  navigate: (route: Route) => void
}

export function HeroSection({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  supportNote,
  quickFacts,
  media,
  navigate,
}: HeroSectionProps) {
  return (
    <section className="hero-section hero-section--garden">
      <div className="hero-section__stage card">
        <img className="hero-section__backdrop" src={media.src} alt={media.alt} />
        <div className="hero-section__veil" />
        <div className="hero-section__copy hero-section__copy--overlay">
          <p className="hero-section__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-section__description">{description}</p>
          <div className="hero-section__actions hero-section__actions--conversion">
            <CTAButton label={primaryCta.label} href={primaryCta.href} navigate={navigate} size="large" />
            <CTAButton
              label={secondaryCta.label}
              href={secondaryCta.href}
              navigate={navigate}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
            />
          </div>
          <div className="hero-section__facts" aria-label="Quick play facts">
            {quickFacts.map((item) => (
              <span key={item} className="hero-section__fact">
                {item}
              </span>
            ))}
          </div>
          <p className="hero-section__support-note">{supportNote}</p>
        </div>
      </div>
    </section>
  )
}
