import { FighterId } from '../game/types';

interface Props {
  id: FighterId;
  className?: string;
}

export function FighterEmblem({ id, className = 'w-8 h-8' }: Props) {
  if (id === 'solaris') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <polygon points="20,3 35,14 29,34 11,34 5,14" stroke="#FBBF24" strokeWidth="2.5" fill="#78350F" fillOpacity="0.65" />
        <polygon points="20,9 28,17 20,29 12,17" fill="#FDE047" />
      </svg>
    );
  }

  if (id === 'nightwarden') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <path d="M4 16L13 11L20 17L27 11L36 16L29 29L20 24L11 29L4 16Z" fill="#0EA5E9" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="2.2" />
        <path d="M12 18L20 22L28 18L24 25H16L12 18Z" fill="#38BDF8" />
      </svg>
    );
  }

  if (id === 'voltaire') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <circle cx="20" cy="20" r="15" stroke="#FACC15" strokeWidth="2.2" fill="#7F1D1D" fillOpacity="0.6" />
        <polygon points="23,7 13,21 20,21 17,33 27,19 20,19" fill="#FEF08A" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="14" stroke="#C084FC" strokeWidth="2.2" fill="#312E81" fillOpacity="0.65" />
      <path d="M20 8L25 20L20 32L15 20L20 8Z" fill="#E879F9" />
      <circle cx="20" cy="20" r="4" fill="#090B10" />
    </svg>
  );
}
