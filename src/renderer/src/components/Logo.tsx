interface LogoProps {
  size?: number
  inverted?: boolean
}

/** The Taraz mark: an eight-point Persian star with a rising balance line. */
export function LogoMark({ size = 30, inverted = false }: LogoProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M24 5.5 28.9 19.1 42.5 24 28.9 28.9 24 42.5 19.1 28.9 5.5 24 19.1 19.1Z"
        stroke={inverted ? '#0B4033' : '#E0BF7A'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 28.2 21.4 22.2 26 26.2 32.7 17.8"
        stroke={inverted ? '#0D5B47' : '#F1DCA9'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32.7" cy="17.8" r="1.8" fill={inverted ? '#0D5B47' : '#F1DCA9'} />
      <path
        d="M24 12v24M12 24h24"
        stroke={inverted ? '#0B4033' : '#E0BF7A'}
        strokeWidth="0.8"
        opacity="0.35"
      />
    </svg>
  )
}
