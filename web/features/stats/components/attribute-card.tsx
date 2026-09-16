import type { LifeAttribute } from "../types/stats";
import { LIFE_ATTRIBUTES } from "../types/stats";

function HexagonBadgeIcon({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <polygon
        points="20,8 30,14 30,26 20,32 10,26 10,14"
        fill={color}
        fillOpacity="0.65"
      />
    </svg>
  );
}

type AttributeCardProps = {
  attribute: LifeAttribute;
  score: number;
  isSelected: boolean;
  onSelect: (attribute: LifeAttribute) => void;
};

export function AttributeCard({
  attribute,
  score,
  isSelected,
  onSelect,
}: AttributeCardProps) {
  const meta = LIFE_ATTRIBUTES[attribute];

  return (
    <button
      type="button"
      className={`statAttributeCard ${isSelected ? "isSelected" : ""}`}
      style={{
        borderColor: isSelected ? meta.color : "rgba(255, 255, 255, 0.08)",
        boxShadow: isSelected ? `0 0 16px ${meta.glowColor}` : undefined,
      }}
      onClick={() => onSelect(attribute)}
      aria-label={`${meta.name}: ${score} points. Click to view details`}
    >
      <div className="statCardIconWrap">
        <HexagonBadgeIcon color={meta.color} size={36} />
      </div>
      <div className="statCardInfo">
        <span className="statCardScore">{score}</span>
        <span className="statCardName" style={{ color: meta.color }}>
          {meta.name}
        </span>
      </div>
    </button>
  );
}
