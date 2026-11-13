import logoUrl from './assets/logo.svg'

type LogoProps = {
  size?: number
}

export function Logo({ size = 40 }: LogoProps) {
  return <img className="brand-logo" data-testid="logo" src={logoUrl} alt="" aria-hidden="true" width={size} height={size} />
}
