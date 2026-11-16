import logoUrl from './assets/logo.svg'

type LogoProps = {
  id?: string
  size?: number
  className?: string
  loading?: 'lazy' | 'eager'
  title?: string
}

export function Logo({ id, size = 40, className, loading, title }: LogoProps) {
  return <img id={id} className={className ? `brand-logo ${className}` : 'brand-logo'} data-testid="logo" src={logoUrl} alt="" aria-hidden="true" width={size} height={size} loading={loading} title={title} />
}
