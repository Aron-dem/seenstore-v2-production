interface LogoProps {
  white?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function SeenstoreLogo({ white = false, size = "md" }: LogoProps) {
  const scales = { sm: 1.1, md: 1.8, lg: 2.2 };
  const s = scales[size];
  const imgH = Math.round(36 * s);
  const accentColor = "#E63946";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", direction: "ltr" }}>
      <img
        src="/logo.png"
        alt="SEEN"
        style={{ height: imgH, width: "auto", display: "block" }}
      />
      <svg
        width={Math.round(74 * s)}
        height={Math.round(36 * s)}
        viewBox="0 0 74 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <text
          x="0"
          y="27"
          fontFamily="'Bebas Neue', 'Poppins', sans-serif"
          fontSize="28"
          fontWeight="700"
          letterSpacing="2"
          fill={accentColor}
        >
          STORE
        </text>
        <rect x="0" y="31" width="74" height="2" fill={accentColor} rx="1" />
      </svg>
    </div>
  );
}
