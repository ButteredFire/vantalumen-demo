import React from 'react';
import type { CelestialCategory } from '../../types/cosmos.types';

export type CalloutVariant = 1 | 2 | 3 | 4;

interface AssetCalloutBoxProps {
  title: string;
  meta?: string;
  category: CelestialCategory;
  variant?: CalloutVariant;
  isSelected?: boolean;
  isVisible?: boolean;
  onClick: () => void;
}

/**
 * Sci-Fi HUD Callout Box component replicating stepped/chamfered polygonal frames,
 * dual accent borders, diagonal tech stripes, and animated SVG leader-line + concentric anchor reticle.
 */
export const AssetCalloutBox: React.FC<AssetCalloutBoxProps> = ({
  title,
  meta,
  category,
  variant = 1,
  isSelected = false,
  isVisible = true,
  onClick,
}) => {
  const categoryClass =
    category === 'MOON'
      ? 'is-orbital'
      : category === 'SPACECRAFT'
        ? 'is-spacecraft'
        : 'is-surface';

  // Anchor dot is placed at x=196, y=104 (in viewBox 0 0 240 116)
  // Leader line connects from bottom of the chamfered box down to the anchor reticle at (196, 102)
  const renderFrameSvg = () => {
    switch (variant) {
      case 2:
        // Variant 2: Top-right stepped notch, bottom-left leader going down-center-right
        return (
          <svg
            className="callout-svg"
            viewBox="0 0 240 116"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Outer thin accent brackets */}
            <path
              className="callout-accent-stroke"
              d="M 10 18 L 10 8 L 28 8 M 168 4 L 224 4 L 234 14 L 234 52"
            />
            <path
              className="callout-accent-stroke"
              d="M 12 72 L 26 84 L 78 84"
            />
            {/* Main polygonal chamfered frame fill + animated stroke */}
            <path
              className="callout-frame-bg"
              d="M 14 14 L 154 14 L 164 20 L 218 20 L 228 10 L 228 66 L 216 78 L 88 78 L 76 68 L 24 68 L 14 58 Z"
            />
            <path
              className="callout-frame-stroke"
              d="M 14 14 L 154 14 L 164 20 L 218 20 L 228 10 L 228 66 L 216 78 L 88 78 L 76 68 L 24 68 L 14 58 Z"
            />
            {/* Animated diagonal leader line down to anchor reticle */}
            <path
              className="callout-leader-stroke"
              d="M 82 78 L 118 103"
            />
          </svg>
        );
      case 3:
        // Variant 3: Stepped upper-left shoulder + bold corner chamfer
        return (
          <svg
            className="callout-svg"
            viewBox="0 0 240 116"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="callout-accent-stroke"
              d="M 6 50 L 6 24 L 22 8 L 68 8 M 184 78 L 218 78 L 234 62"
            />
            <path
              className="callout-frame-bg"
              d="M 12 28 L 26 14 L 66 14 L 76 22 L 136 22 L 148 10 L 222 10 L 228 16 L 228 58 L 212 74 L 106 74 L 94 66 L 20 66 L 12 58 Z"
            />
            <path
              className="callout-frame-stroke"
              d="M 12 28 L 26 14 L 66 14 L 76 22 L 136 22 L 148 10 L 222 10 L 228 16 L 228 58 L 212 74 L 106 74 L 94 66 L 20 66 L 12 58 Z"
            />
            <path
              className="callout-leader-stroke"
              d="M 98 70 L 126 103"
            />
          </svg>
        );
      case 4:
        // Variant 4: Sleek octagonal frame with diagonal hazard/tech hash marks
        return (
          <svg
            className="callout-svg"
            viewBox="0 0 240 116"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Tech hash marks on top-right & bottom-left */}
            <path
              className="callout-hatch-stroke"
              d="M 152 8 L 158 14 M 161 8 L 167 14 M 170 8 L 176 14 M 179 8 L 185 14"
            />
            <path
              className="callout-hatch-stroke"
              d="M 88 74 L 94 80 M 97 74 L 103 80 M 106 74 L 112 80"
            />
            <path
              className="callout-accent-stroke"
              d="M 8 56 L 8 20 L 20 8 M 232 22 L 232 58 L 214 76 L 156 76"
            />
            <path
              className="callout-frame-bg"
              d="M 14 22 L 26 10 L 146 10 L 156 16 L 226 16 L 226 56 L 208 72 L 132 72 L 120 66 L 14 66 Z"
            />
            <path
              className="callout-frame-stroke"
              d="M 14 22 L 26 10 L 146 10 L 156 16 L 226 16 L 226 56 L 208 72 L 132 72 L 120 66 L 14 66 Z"
            />
            <path
              className="callout-leader-stroke"
              d="M 122 69 L 158 103"
            />
          </svg>
        );
      case 1:
      default:
        // Variant 1: Classic stepped top plateau + bottom bevel + right-angled leader line
        return (
          <svg
            className="callout-svg"
            viewBox="0 0 240 116"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="callout-accent-stroke"
              d="M 148 7 L 222 7 L 234 19 L 234 52 M 12 64 L 24 76 L 64 76"
            />
            <path
              className="callout-frame-bg"
              d="M 12 18 L 42 18 L 52 10 L 218 10 L 228 20 L 228 62 L 216 74 L 166 74 L 154 66 L 72 66 L 60 72 L 20 72 L 12 64 Z"
            />
            <path
              className="callout-frame-stroke"
              d="M 12 18 L 42 18 L 52 10 L 218 10 L 228 20 L 228 62 L 216 74 L 166 74 L 154 66 L 72 66 L 60 72 L 20 72 L 12 64 Z"
            />
            <path
              className="callout-leader-stroke"
              d="M 156 68 L 194 103"
            />
          </svg>
        );
    }
  };

  // Anchor coordinates per variant so the concentric dot aligns with the leader tip
  const anchorLeftPct =
    variant === 1 ? '81%' : variant === 2 ? '49%' : variant === 3 ? '52.5%' : '66%';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`hud-callout-box variant-${variant} ${categoryClass} ${
        isSelected ? 'is-active' : ''
      } ${isVisible ? 'is-visible' : 'is-hidden'}`}
      style={{ ['--anchor-x' as string]: anchorLeftPct }}
    >
      <div className="callout-frame-layer">
        {renderFrameSvg()}
        <span className="callout-scan-beam" aria-hidden="true" />
      </div>

      <div className="callout-content">
        {meta && <span className="callout-meta">{meta}</span>}
        <span className="callout-title">{title}</span>
      </div>

      {/* Concentric target anchor circle at the tip of the leader line */}
      <span
        className="callout-anchor-reticle"
        style={{ left: anchorLeftPct }}
        aria-hidden="true"
      >
        <span className="reticle-outer-ring" />
        <span className="reticle-inner-dot" />
      </span>
    </button>
  );
};
