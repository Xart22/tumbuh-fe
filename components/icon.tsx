type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

/** Material Symbols glyph (decorative — always paired with adjacent text). */
export function Icon({ name, className = '', filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? 'lp-icon-fill' : ''} ${className}`}
    >
      {name}
    </span>
  );
}
