interface GoogleGProps {
  size?: number;
}

export function GoogleG({ size = 18 }: GoogleGProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 12.2 C21.6 11.4 21.5 10.7 21.4 10 H12 V13.9 H17.4 C17.2 15.2 16.4 16.3 15.3 17 V19.5 H18.6 C20.5 17.8 21.6 15.2 21.6 12.2 Z" fill="#4285F4" />
      <path d="M12 22 C14.7 22 17 21.1 18.6 19.5 L15.3 17 C14.4 17.6 13.3 18 12 18 C9.4 18 7.2 16.3 6.4 13.9 H3 V16.4 C4.6 19.7 8 22 12 22 Z" fill="#34A853" />
      <path d="M6.4 13.9 C6.2 13.3 6.1 12.7 6.1 12 C6.1 11.3 6.2 10.7 6.4 10.1 V7.6 H3 C2.4 8.9 2 10.4 2 12 C2 13.6 2.4 15.1 3 16.4 L6.4 13.9 Z" fill="#FBBC05" />
      <path d="M12 6 C13.5 6 14.8 6.5 15.8 7.5 L18.7 4.7 C17 3.1 14.7 2 12 2 C8 2 4.6 4.3 3 7.6 L6.4 10.1 C7.2 7.7 9.4 6 12 6 Z" fill="#EA4335" />
    </svg>
  );
}
