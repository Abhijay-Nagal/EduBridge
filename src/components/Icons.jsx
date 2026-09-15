// Inline SVG icon set — keeps the PWA dependency-free and offline-safe.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

const make = (paths) =>
  function Icon({ className = 'h-5 w-5', ...rest }) {
    return (
      <svg {...base} className={className} aria-hidden="true" {...rest}>
        {paths}
      </svg>
    )
  }

export const HomeIcon = make(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </>,
)

export const BookIcon = make(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
    <path d="M19 19v2H6.5A2.5 2.5 0 0 1 4 18.5" />
  </>,
)

export const BellIcon = make(
  <>
    <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </>,
)

export const QuizIcon = make(
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>,
)

export const CalendarIcon = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
)

export const ChartIcon = make(
  <>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </>,
)

export const RupeeIcon = make(
  <>
    <path d="M7 4h10M7 9h10M7 4c5 0 7 1.5 7 4s-2 4-7 4l8 8" />
  </>,
)

export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2A3.2 3.2 0 0 1 16 14M18 20c0-2.6-1-4.4-2.5-5.2" />
  </>,
)

export const UploadIcon = make(
  <>
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </>,
)

export const CheckIcon = make(<path d="M4 12.5 9 17.5 20 6.5" />)

export const XIcon = make(<path d="M6 6l12 12M18 6L6 18" />)

export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
)

export const LogoutIcon = make(
  <>
    <path d="M15 12H4M8 8l-4 4 4 4" />
    <path d="M10 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8" />
  </>,
)

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)

export const TrashIcon = make(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </>,
)

export const ChevronRightIcon = make(<path d="M9 5l7 7-7 7" />)

export const ArrowLeftIcon = make(<path d="M19 12H5M11 6l-6 6 6 6" />)

export const DownloadIcon = make(
  <>
    <path d="M12 4v12M8 12l4 4 4-4" />
    <path d="M4 20h16" />
  </>,
)

export const LinkIcon = make(
  <>
    <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.5 6.3" />
    <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.3-1.3" />
  </>,
)

export const SparkIcon = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5" />
  </>,
)

export const ShieldIcon = make(
  <>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </>,
)

export const GraduationIcon = make(
  <>
    <path d="M12 4 2 9l10 5 10-5z" />
    <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
  </>,
)
