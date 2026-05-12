interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }: IconProps) {
  const s = size;
  const common = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'bank':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 10 L12 4 L21 10 M5 10 L5 18 M9 10 L9 18 M15 10 L15 18 M19 10 L19 18 M3 20 L21 20" {...common}/></svg>;
    case 'house':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 11 L12 4 L20 11 L20 20 L4 20 Z M10 20 L10 14 L14 14 L14 20" {...common}/></svg>;
    case 'shield':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 V6 Z" {...common}/></svg>;
    case 'briefcase':
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5" {...common}/><path d="M9 7 V5 H15 V7" {...common}/></svg>;
    case 'wrench':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 3 A5 5 0 0 0 9 11 L3 17 L7 21 L13 15 A5 5 0 0 0 21 10 L17 14 L13 10 Z" {...common}/></svg>;
    case 'hammer':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 4 L20 10 L17 13 L11 7 Z M11 7 L4 14 L7 17 L14 10" {...common}/></svg>;
    case 'file':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 3 L15 3 L20 8 L20 21 L6 21 Z M15 3 L15 8 L20 8" {...common}/></svg>;
    case 'plus':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" {...common}/></svg>;
    case 'upload':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 17 V5 M6 11 L12 5 L18 11 M4 19 H20" {...common}/></svg>;
    case 'send':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 12 L21 4 L15 21 L12 13 Z" {...common}/></svg>;
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 12 L10 17 L19 7" {...common}/></svg>;
    case 'check-circle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...common}/><path d="M8 12 L11 15 L16 9" {...common}/></svg>;
    case 'x':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" {...common}/></svg>;
    case 'chevron-r':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 5 L16 12 L9 19" {...common}/></svg>;
    case 'chevron-d':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 9 L12 16 L19 9" {...common}/></svg>;
    case 'arrow-r':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 12 H20 M14 6 L20 12 L14 18" {...common}/></svg>;
    case 'arrow-l':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M20 12 H4 M10 6 L4 12 L10 18" {...common}/></svg>;
    case 'sparkle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L13.5 9 L20 10.5 L13.5 12 L12 18 L10.5 12 L4 10.5 L10.5 9 Z" {...common}/></svg>;
    case 'shield-check':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 V6 Z M8 12 L11 15 L16 10" {...common}/></svg>;
    case 'globe':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...common}/><path d="M3 12 H21 M12 3 C15 6 16.5 9 16.5 12 C16.5 15 15 18 12 21 C9 18 7.5 15 7.5 12 C7.5 9 9 6 12 3" {...common}/></svg>;
    case 'scale':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 4 V20 M5 20 H19 M7 8 L4 14 H10 L7 8 Z M17 8 L14 14 H20 L17 8 Z M12 5 L7 8 M12 5 L17 8" {...common}/></svg>;
    case 'chart':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 20 V4 M4 20 H20 M8 16 V12 M12 16 V8 M16 16 V14" {...common}/></svg>;
    case 'compare':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 4 H4 V20 H9 M15 4 H20 V20 H15 M9 8 V16 M15 8 V16 M12 4 V20" {...common}/></svg>;
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 20 H8 L18 10 L14 6 L4 16 Z M14 6 L18 10" {...common}/></svg>;
    case 'mail':
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" {...common}/><path d="M3 7 L12 13 L21 7" {...common}/></svg>;
    case 'sliders':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 7 H20 M4 12 H20 M4 17 H20" {...common}/><circle cx="9" cy="7" r="2.2" {...common} fill="#fff"/><circle cx="15" cy="12" r="2.2" {...common} fill="#fff"/><circle cx="7" cy="17" r="2.2" {...common} fill="#fff"/></svg>;
    case 'search':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" {...common}/><path d="M16 16 L20 20" {...common}/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" {...common}/></svg>;
  }
}
