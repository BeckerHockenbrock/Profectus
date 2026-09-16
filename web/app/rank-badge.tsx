"use client";

import type { RankTier } from "@/lib/stats-types";
import { RANK_TIERS } from "@/lib/stats-types";

interface RankBadgeProps {
  tier: RankTier;
  division?: number;
  size?: number;
  showGlow?: boolean;
  className?: string;
}

export function RankBadge({
  tier,
  division = 1,
  size = 56,
  showGlow = true,
  className = "",
}: RankBadgeProps) {
  const meta = RANK_TIERS.find((t) => t.tier === tier) || RANK_TIERS[0];

  // Colors based on tier
  const mainColor = meta.color;
  const accentColor = meta.accentColor;

  return (
    <div
      className={`rankBadgeContainer ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        filter: showGlow ? `drop-shadow(0 0 ${Math.max(6, size * 0.18)}px ${meta.badgeGlow})` : undefined,
      }}
      aria-label={`${meta.displayName} ${tier !== "radiant" ? division : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={mainColor} />
          </linearGradient>
          <linearGradient id={`innerGrad-${tier}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Tier-specific geometric artwork inspired by Valorant */}
        {tier === "iron" && (
          <g>
            <polygon points="32,6 54,20 54,44 32,58 10,44 10,20" fill="#2d3748" stroke="#4a5568" strokeWidth="2" />
            <polygon points="32,12 48,23 48,41 32,52 16,41 16,23" fill="#1a202c" stroke="#718096" strokeWidth="1.5" />
            <polygon points="32,18 42,26 42,38 32,46 22,38 22,26" fill={`url(#grad-${tier})`} />
          </g>
        )}

        {tier === "bronze" && (
          <g>
            <polygon points="32,5 56,19 50,47 32,59 14,47 8,19" fill="#451a03" stroke={accentColor} strokeWidth="2" />
            <polygon points="32,12 48,23 44,43 32,51 20,43 16,23" fill="#291102" stroke="#b45309" strokeWidth="1.5" />
            <polygon points="32,18 43,26 39,40 32,45 25,40 21,26" fill={`url(#grad-${tier})`} />
            <line x1="32" y1="12" x2="32" y2="48" stroke={accentColor} strokeWidth="1" strokeOpacity="0.6" />
          </g>
        )}

        {tier === "silver" && (
          <g>
            <polygon points="32,4 58,16 52,48 32,60 12,48 6,16" fill="#334155" stroke={accentColor} strokeWidth="2" />
            <polygon points="32,10 50,22 46,44 32,53 18,44 14,22" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
            <polygon points="32,17 44,26 40,41 32,47 24,41 20,26" fill={`url(#grad-${tier})`} />
            <polygon points="32,23 38,28 32,41 26,28" fill="#ffffff" fillOpacity="0.4" />
          </g>
        )}

        {tier === "gold" && (
          <g>
            <path d="M32 4 L56 16 L48 48 L32 60 L16 48 L8 16 Z" fill="#422006" stroke={accentColor} strokeWidth="2" />
            <polygon points="32,10 50,22 44,45 32,54 20,45 14,22" fill="#713f12" stroke="#facc15" strokeWidth="1.5" />
            <polygon points="32,16 44,25 39,41 32,48 25,41 20,25" fill={`url(#grad-${tier})`} />
            {/* Wing details */}
            <polygon points="4,24 14,20 12,36" fill={accentColor} />
            <polygon points="60,24 50,20 52,36" fill={accentColor} />
            <circle cx="32" cy="32" r="4" fill="#ffffff" />
          </g>
        )}

        {tier === "platinum" && (
          <g>
            <polygon points="32,3 60,18 48,52 32,61 16,52 4,18" fill="#083344" stroke={accentColor} strokeWidth="2.2" />
            <polygon points="32,9 52,22 43,47 32,54 21,47 12,22" fill="#164e63" stroke="#22d3ee" strokeWidth="1.5" />
            <polygon points="32,15 45,26 38,43 32,48 26,43 19,26" fill={`url(#grad-${tier})`} />
            {/* Crystal facets */}
            <line x1="32" y1="3" x2="32" y2="61" stroke="#ecfeff" strokeWidth="1.5" strokeOpacity="0.7" />
            <line x1="12" y1="22" x2="52" y2="22" stroke="#ecfeff" strokeWidth="1" strokeOpacity="0.5" />
          </g>
        )}

        {tier === "diamond" && (
          <g>
            {/* Diamond multifaceted gem */}
            <polygon points="32,2 58,16 54,48 32,62 10,48 6,16" fill="#3b0764" stroke={accentColor} strokeWidth="2.2" />
            <polygon points="32,8 52,21 47,44 32,55 17,44 12,21" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
            <polygon points="32,14 45,25 40,41 32,48 24,41 19,25" fill={`url(#grad-${tier})`} />
            {/* Gem highlights */}
            <polygon points="32,14 45,25 32,32" fill="#ffffff" fillOpacity="0.4" />
            <polygon points="32,14 19,25 32,32" fill="#ffffff" fillOpacity="0.25" />
            <circle cx="32" cy="32" r="5" fill="#f3e8ff" />
          </g>
        )}

        {tier === "ascendant" && (
          <g>
            {/* Ascendant emerald crest */}
            <polygon points="32,2 60,15 52,50 32,62 12,50 4,15" fill="#022c22" stroke={accentColor} strokeWidth="2.5" />
            <polygon points="32,8 53,20 46,45 32,55 18,45 11,20" fill="#064e3b" stroke="#34d399" strokeWidth="1.8" />
            <polygon points="32,14 46,25 40,41 32,49 24,41 18,25" fill={`url(#grad-${tier})`} />
            {/* Emerald inner core */}
            <polygon points="32,18 42,27 32,42 22,27" fill="#6ee7b7" />
            <polygon points="32,23 37,29 32,38 27,29" fill="#ffffff" />
          </g>
        )}

        {tier === "immortal" && (
          <g>
            {/* Immortal crimson horns / fierce shield */}
            <path d="M32 2 L56 12 L62 26 L48 54 L32 62 L16 54 L2 26 L8 12 Z" fill="#450a0a" stroke={accentColor} strokeWidth="2.5" />
            <path d="M32 8 L50 17 L54 28 L43 49 L32 56 L21 49 L10 28 L14 17 Z" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="1.8" />
            <polygon points="32,14 44,24 38,44 32,50 26,44 20,24" fill={`url(#grad-${tier})`} />
            {/* Fierce core */}
            <polygon points="32,18 40,28 32,42 24,28" fill="#fda4af" />
            <circle cx="32" cy="30" r="4" fill="#ffffff" />
            {/* Horn spikes */}
            <polygon points="6,10 14,14 8,24" fill={accentColor} />
            <polygon points="58,10 50,14 56,24" fill={accentColor} />
          </g>
        )}

        {tier === "radiant" && (
          <g>
            {/* Radiant golden sunburst crest */}
            <circle cx="32" cy="32" r="26" fill="#451a03" stroke="#f59e0b" strokeWidth="2.5" />
            {/* Radiant rays */}
            <polygon points="32,1 36,12 28,12" fill="#fbbf24" />
            <polygon points="32,63 36,52 28,52" fill="#fbbf24" />
            <polygon points="1,32 12,28 12,36" fill="#fbbf24" />
            <polygon points="63,32 52,28 52,36" fill="#fbbf24" />
            <polygon points="9,9 19,16 14,21" fill="#fcd34d" />
            <polygon points="55,9 45,16 50,21" fill="#fcd34d" />
            <polygon points="9,55 19,48 14,43" fill="#fcd34d" />
            <polygon points="55,55 45,48 50,43" fill="#fcd34d" />
            {/* Star polygon */}
            <polygon points="32,8 46,20 46,44 32,56 18,44 18,20" fill={`url(#grad-${tier})`} stroke="#fef08a" strokeWidth="1.5" />
            <polygon points="32,16 40,25 40,39 32,48 24,39 24,25" fill="#ffffff" fillOpacity="0.85" />
            <circle cx="32" cy="32" r="5" fill="#ffffff" />
          </g>
        )}

        {/* Division Pips at bottom for non-radiant tiers */}
        {tier !== "radiant" && (
          <g transform="translate(0, 52)">
            {division >= 1 && (
              <circle
                cx={division === 1 ? 32 : division === 2 ? 28 : 24}
                cy="6"
                r="2.2"
                fill={accentColor}
                stroke="#000000"
                strokeWidth="0.8"
              />
            )}
            {division >= 2 && (
              <circle
                cx={division === 2 ? 36 : 32}
                cy="6"
                r="2.2"
                fill={accentColor}
                stroke="#000000"
                strokeWidth="0.8"
              />
            )}
            {division >= 3 && (
              <circle
                cx="40"
                cy="6"
                r="2.2"
                fill={accentColor}
                stroke="#000000"
                strokeWidth="0.8"
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
