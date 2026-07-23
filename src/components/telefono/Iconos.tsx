/**
 * Iconos SVG inline del sistema simulado, al estilo SF Symbols de iOS.
 * Sin dependencias ni fuentes externas; heredan el color con currentColor.
 */

interface Props {
  className?: string;
}

function Svg({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={className} fill="currentColor">
      {children}
    </svg>
  );
}

export function IconoCandado({ className }: Props) {
  return (
    <Svg className={className}>
      <path
        d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="3" />
    </Svg>
  );
}

export function IconoClima({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M7 18.5h9.5a4 4 0 0 0 .9-7.9 6 6 0 0 0-11.6 1.2A3.8 3.8 0 0 0 7 18.5z" />
    </Svg>
  );
}

export function IconoCampana({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 3a6 6 0 0 0-6 6v3.2L4.4 15.6A1.2 1.2 0 0 0 5.5 17.4h13a1.2 1.2 0 0 0 1.1-1.8L18 12.2V9a6 6 0 0 0-6-6z" />
      <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0z" />
    </Svg>
  );
}

export function IconoCampanaTachada({ className }: Props) {
  return (
    <Svg className={className}>
      <path
        d="M12 3a6 6 0 0 0-6 6v3.2L4.4 15.6A1.2 1.2 0 0 0 5.5 17.4h13a1.2 1.2 0 0 0 1.1-1.8L18 12.2V9a6 6 0 0 0-6-6z"
        opacity="0.55"
      />
      <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0z" opacity="0.55" />
      <path
        d="M4 4l16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconoAudifonos({ className }: Props) {
  return (
    <Svg className={className}>
      <path
        d="M4.5 14.5V13a7.5 7.5 0 0 1 15 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="3.5" y="13.5" width="4" height="7" rx="2" />
      <rect x="16.5" y="13.5" width="4" height="7" rx="2" />
    </Svg>
  );
}

export function IconoNota({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M9.5 17.5V6.2a1 1 0 0 1 .8-1l8-1.6a1 1 0 0 1 1.2 1v10.9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="17.5" r="2.6" />
      <circle cx="17" cy="15.5" r="2.6" />
    </Svg>
  );
}

export function IconoPlay({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M8 5.3v13.4a1 1 0 0 0 1.5.9l11-6.7a1 1 0 0 0 0-1.8l-11-6.7A1 1 0 0 0 8 5.3z" />
    </Svg>
  );
}

export function IconoPausa({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="6" y="5" width="4.5" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" />
    </Svg>
  );
}

export function IconoAnterior({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="4" y="5" width="2.5" height="14" rx="1" />
      <path d="M20 5.6v12.8a1 1 0 0 1-1.6.8L9.7 12.8a1 1 0 0 1 0-1.6l8.7-6.4a1 1 0 0 1 1.6.8z" />
    </Svg>
  );
}

export function IconoEscudo({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 2.5 5 5.2a1 1 0 0 0-.6.9V11c0 4.9 3 8.4 7.2 10.3a1 1 0 0 0 .8 0C16.6 19.4 19.6 15.9 19.6 11V6.1a1 1 0 0 0-.6-.9z" />
      <path
        d="m8.8 11.6 2.2 2.2 4.2-4.4"
        fill="none"
        stroke="var(--color-carcasa)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconoLinterna({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M8 3h8v3l-2 3v10a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V9L8 6z" />
      <circle cx="12" cy="13" r="1.2" fill="var(--color-carcasa)" />
    </Svg>
  );
}

export function IconoCamaraLock({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7.5h3.2l1.2-1.8a1.5 1.5 0 0 1 1.2-.7h4.8a1.5 1.5 0 0 1 1.2.7l1.2 1.8H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5z" />
      <circle cx="12" cy="13" r="3.2" fill="var(--color-carcasa)" />
      <circle cx="12" cy="13" r="1.8" />
    </Svg>
  );
}

export function IconoSiguiente({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="17.5" y="5" width="2.5" height="14" rx="1" />
      <path d="M4 5.6v12.8a1 1 0 0 0 1.6.8l8.7-6.4a1 1 0 0 0 0-1.6L5.6 4.8a1 1 0 0 0-1.6.8z" />
    </Svg>
  );
}
