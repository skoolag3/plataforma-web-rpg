import type { ReactNode, SVGProps } from "react";

type PropsIcone = SVGProps<SVGSVGElement>;

function IconeBase({
  children,
  ...props
}: PropsIcone & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      {children}
    </svg>
  );
}

export function IconeInicio(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-2 32 32)"
      >
        <path d="M10 31 32 12l22 18-2 24H13L10 31Z" />
        <path d="M24 53V35h17v18M16 28l2-11 10 1" />
      </g>
    </IconeBase>
  );
}

export function IconeColecao(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-1 32 32)"
      >
        <path d="m9 22 23-12 23 12-23 13L9 22Z" />
        <path d="m10 32 22 12 22-12M12 43l20 11 20-11" />
      </g>
    </IconeBase>
  );
}

export function IconeDecks(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(4 32 32)"
      >
        <path d="M15 7h36l-3 50H12l3-50Z" />
        <path d="m32 19 9 13-10 14-9-13 10-14Z" />
        <path d="m17 13-7 4 3 36" opacity=".65" />
      </g>
    </IconeBase>
  );
}

export function IconeGacha(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-3 32 32)"
      >
        <path d="M32 7v10M32 47v10M7 32h10M47 32h10" />
        <path d="m32 17 6 9 10 6-10 6-6 9-6-9-10-6 10-6 6-9Z" />
        <path d="m13 16 6 2-3-6M51 48l-6-2 3 6" />
        <circle cx="32" cy="32" r="24" strokeDasharray="5 7" />
      </g>
    </IconeBase>
  );
}

export function IconeLoja(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(3 32 32)"
      >
        <path d="M11 27h42l-3 29H14l-3-29Z" />
        <path d="M8 12h49l-5 16H13L8 12Z" />
        <path d="M25 42h15M12 8l10 2" opacity=".65" />
      </g>
    </IconeBase>
  );
}

export function IconeExpedicao(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-2 32 32)"
      >
        <path d="m12 9 40 41M52 9 11 51" />
        <path d="m9 7 13 3-9 9M55 7l-13 3 9 9M8 56l13-13M56 56 43 43" />
        <path d="m7 48 9 9M57 48l-9 9" />
      </g>
    </IconeBase>
  );
}

export function IconeRanking(props: PropsIcone) {
  return (
    <IconeBase {...props}>
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(2 32 32)"
      >
        <path d="M20 8h25v14c0 12-5 19-14 23-9-4-14-11-14-23l3-14Z" />
        <path d="M18 14H8c0 13 5 19 13 19M45 14h11c0 13-5 19-14 19M31 45v10M20 57h23" />
      </g>
    </IconeBase>
  );
}
