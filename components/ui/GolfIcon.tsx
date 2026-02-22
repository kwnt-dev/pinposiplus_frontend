interface GolfIconProps {
  size?: number;
  className?: string;
}

export function GolfIcon({ size = 24, className = "" }: GolfIconProps) {
  return (
    <svg viewBox="0 0 54 54" width={size} height={size} className={className}>
      <ellipse style={{ fill: "#88C057" }} cx="27" cy="40" rx="27" ry="11.5" />
      <ellipse
        style={{ fill: "#659C35" }}
        cx="19"
        cy="40.833"
        rx="18"
        ry="7.667"
      />
      <ellipse
        style={{ fill: "#38454F" }}
        cx="21.071"
        cy="39.222"
        rx="6.071"
        ry="4.722"
      />
      <polygon style={{ fill: "#E64C3C" }} points="19,3.5 37,8.5 19,14.5" />
      <circle style={{ fill: "#FFFFFF" }} cx="40" cy="42.5" r="3" />
      <line
        style={{
          fill: "none",
          stroke: "#ECF0F1",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeMiterlimit: 10,
        }}
        x1="19"
        y1="38.5"
        x2="19"
        y2="3.5"
      />
    </svg>
  );
}
