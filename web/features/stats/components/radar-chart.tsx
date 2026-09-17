"use client";

import { useMemo, useState } from "react";
import type { LifeAttribute } from "../types/stats";
import { ATTRIBUTE_ORDER, LIFE_ATTRIBUTES } from "../types/stats";
import {
  RADAR_ANGLES,
  RADAR_CENTER,
  RADAR_GRID_POLYGONS,
  RADAR_LEVELS,
  RADAR_MAX_RADIUS,
  RADAR_SIZE,
  RADAR_SPOKES,
  getRadarPoint,
} from "../domain/stats-chart-math";

interface RadarChartProps {
  scores: Record<LifeAttribute, number>;
  totalXP?: number;
  onSelectAttribute?: (attr: LifeAttribute) => void;
  selectedAttribute?: LifeAttribute | null;
}

export function RadarChart({
  scores,
  onSelectAttribute,
  selectedAttribute,
}: RadarChartProps) {
  const [hoveredAttr, setHoveredAttr] = useState<LifeAttribute | null>(null);

  // Data polygon points
  const dataPoints = useMemo(() => {
    return ATTRIBUTE_ORDER.map((attr, i) => {
      const score = Math.max(0, Math.min(100, scores[attr] ?? 0));
      const radius = (score / 100) * RADAR_MAX_RADIUS;
      const a = RADAR_ANGLES[i];
      const p = getRadarPoint(a, radius);
      return {
        attr,
        score,
        x: p.x,
        y: p.y,
      };
    });
  }, [scores]);

  const hasAnyScore = useMemo(() => {
    return dataPoints.some((p) => p.score > 0);
  }, [dataPoints]);

  const dataPolygonString = useMemo(() => {
    return dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }, [dataPoints]);

  // Label positioning outside each vertex
  const labelPositions = useMemo(() => {
    const labelRadius = RADAR_MAX_RADIUS + 32;
    return ATTRIBUTE_ORDER.map((attr, i) => {
      const a = RADAR_ANGLES[i];
      const p = getRadarPoint(a, labelRadius);
      // Anchor adjustments based on position
      let textAnchor: "middle" | "start" | "end" = "middle";
      let dy = "0.35em";

      if (i === 0) {
        // Physical (Top)
        dy = "-0.5em";
      } else if (i === 1) {
        // Social (Top-Right)
        textAnchor = "start";
        dy = "-0.2em";
      } else if (i === 2) {
        // Discipline (Bottom-Right)
        textAnchor = "start";
        dy = "0.8em";
      } else if (i === 3) {
        // Mental (Bottom)
        dy = "1.2em";
      } else if (i === 4) {
        // Intellect (Bottom-Left)
        textAnchor = "end";
        dy = "0.8em";
      } else if (i === 5) {
        // Ambition (Top-Left)
        textAnchor = "end";
        dy = "-0.2em";
      }

      return {
        attr,
        meta: LIFE_ATTRIBUTES[attr],
        x: p.x,
        y: p.y,
        textAnchor,
        dy,
        score: scores[attr] ?? 50,
      };
    });
  }, [scores]);

  const activeAttr = hoveredAttr || selectedAttribute;

  return (
    <div className="radarChartWrapper" aria-label="Life Attributes Radar Chart">
      <svg
        className="radarSvg"
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        width="100%"
        height="100%"
        role="img"
      >
        <defs>
          {/* Subtle dark glowing backdrop */}
          <radialGradient id="radarBackdrop" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#222" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#111" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* Polygon fill gradient matching the reference image's translucent white/grey fill */}
          <linearGradient id="polyFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background glow */}
        <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={RADAR_MAX_RADIUS + 20} fill="url(#radarBackdrop)" />

        {/* Concentric Hexagon Grid Lines */}
        <g className="radarGridGroup">
          {RADAR_GRID_POLYGONS.map((poly, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={poly}
              fill="none"
              stroke="rgba(255, 255, 255, 0.11)"
              strokeWidth={idx === RADAR_LEVELS.length - 1 ? "1.5" : "1"}
              strokeDasharray={idx < RADAR_LEVELS.length - 1 ? "3 3" : undefined}
            />
          ))}
        </g>

        {/* Spokes connecting center to outer vertices */}
        <g className="radarSpokesGroup">
          {RADAR_SPOKES.map((spoke, idx) => (
            <line
              key={`spoke-${idx}`}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
              stroke="rgba(255, 255, 255, 0.09)"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Data Polygon Fill & Glow Border */}
        <g className="radarDataGroup">
          {hasAnyScore ? (
            <>
              {/* Subtle outer glow on the polygon */}
              <polygon
                points={dataPolygonString}
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="3.5"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
              />
              {/* Main filled polygon */}
              <polygon
                points={dataPolygonString}
                fill="url(#polyFillGrad)"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {/* Vertex Points (only rendered when an attribute has earned points) */}
          {dataPoints.map((pt) => {
            if (pt.score <= 0) return null;
            const meta = LIFE_ATTRIBUTES[pt.attr];
            const isSelected = activeAttr === pt.attr;

            return (
              <g
                key={`vertex-${pt.attr}`}
                className="radarVertexPoint"
                onClick={() => onSelectAttribute?.(pt.attr)}
                onMouseEnter={() => setHoveredAttr(pt.attr)}
                onMouseLeave={() => setHoveredAttr(null)}
                style={{ cursor: "pointer" }}
              >
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="none"
                    stroke={meta.color}
                    strokeWidth="2"
                    filter="url(#pulseGlow)"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "4.5" : "3.5"}
                  fill={meta.color}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </g>


        {/* Attribute Labels Around the Hexagon */}
        <g className="radarLabelsGroup">
          {labelPositions.map((lbl) => {
            const isSelected = activeAttr === lbl.attr;

            return (
              <g
                key={`label-${lbl.attr}`}
                transform={`translate(${lbl.x}, ${lbl.y})`}
                onClick={() => onSelectAttribute?.(lbl.attr)}
                onMouseEnter={() => setHoveredAttr(lbl.attr)}
                onMouseLeave={() => setHoveredAttr(null)}
                style={{ cursor: "pointer" }}
                className="radarAttributeLabelGroup"
              >
                <text
                  x="0"
                  y="0"
                  dy={lbl.dy}
                  textAnchor={lbl.textAnchor}
                  fill={isSelected ? "#ffffff" : lbl.meta.color}
                  style={{
                    fontSize: "13px",
                    fontWeight: isSelected ? "800" : "700",
                    letterSpacing: "0.03em",
                    filter: isSelected ? `drop-shadow(0 0 6px ${lbl.meta.glowColor})` : undefined,
                    transition: "all 150ms ease",
                  }}
                >
                  {lbl.meta.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
