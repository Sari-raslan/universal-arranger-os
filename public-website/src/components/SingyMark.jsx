export default function SingyMark({ title }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title}>
      <defs>
        <linearGradient id="singyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4c8dff" />
          <stop offset="100%" stopColor="#8c6cf2" />
        </linearGradient>
      </defs>
      <path
        d="M78 18v50a20 20 0 1 1-8-16V30l-8 2v42a20 20 0 1 1-8-16V22a4 4 0 0 1 3.1-3.9l17-4A4 4 0 0 1 78 18Z"
        fill="url(#singyGradient)"
      />
      <circle cx="40" cy="70" r="4.5" fill="#ffffff" opacity="0.85" />
      <circle cx="62" cy="60" r="4.5" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
