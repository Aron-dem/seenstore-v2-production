interface LogoProps {
  white?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function SeenstoreLogo({ white = false, size = "md" }: LogoProps) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 };
  const s = scales[size];
  const w = Math.round(160 * s);
  const h = Math.round(36 * s);

  const textColor   = white ? "#FFFFFF" : "#0A0A0A";
  const accentColor = "#E63946";

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SEENSTORE"
      style={{ direction: "ltr", display: "block" }}
    >
      {/* Red accent bar */}
      <rect x="0" y="0" width="4" height="36" fill={accentColor} rx="1" />

      {/* SEEN */}
      <text
        x="12"
        y="27"
        fontFamily="'Bebas Neue', 'Poppins', sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="2"
        fill={textColor}
      >
        SEEN
      </text>

      {/* STORE — in accent red */}
      <text
        x="82"
        y="27"
        fontFamily="'Bebas Neue', 'Poppins', sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="2"
        fill={accentColor}
      >
        STORE
      </text>

      {/* Bottom underline for STORE */}
      <rect x="82" y="31" width="74" height="2" fill={accentColor} rx="1" />
    </svg>
  );
}
