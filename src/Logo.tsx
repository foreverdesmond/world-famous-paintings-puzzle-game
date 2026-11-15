import logoUrl from './assets/logo.svg'

type LogoProps = {
  size?: number
  className?: string
  loading?: 'lazy' | 'eager'
}

export function Logo({ size = 40, className, loading }: LogoProps) {
  return <img className={className ? `brand-logo ${className}` : 'brand-logo'} data-testid="logo" src={logoUrl} alt="" aria-hidden="true" width={size} height={size} loading={loading} />
}
