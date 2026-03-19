import type { ButtonHTMLAttributes } from 'react'
import { AppLink } from './AppLink'
import type { Route } from '../router'

type CTAButtonProps = {
  label: string
  navigate: (route: Route) => void
  href?: string
  target?: string
  rel?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'large'
  block?: boolean
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'disabled'>

export function CTAButton({
  label,
  navigate,
  href,
  target,
  rel,
  variant = 'primary',
  size = 'default',
  block = false,
  onClick,
  type = 'button',
  disabled,
}: CTAButtonProps) {
  const className = [
    'cta-button',
    `cta-button--${variant}`,
    size === 'large' ? 'cta-button--large' : '',
    block ? 'cta-button--block' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return <AppLink href={href} className={className} navigate={navigate} target={target} rel={rel}>{label}</AppLink>
  }

  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
