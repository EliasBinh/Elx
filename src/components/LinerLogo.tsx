import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LinerLogoProps {
  size?: number;
  color?: string;
}

/**
 * Exact Liner Desktop "hl" signature logo mark.
 */
export const LinerLogo: React.FC<LinerLogoProps> = ({
  size = 28,
  color = '#ffffff',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M20 20 C20 13.37 25.37 8 32 8 C38.63 8 44 13.37 44 20 L44 48 C44 54.63 49.37 60 56 60 L68 60 C74.63 60 80 54.63 80 48 L80 40 C80 33.37 85.37 28 92 28 C98.63 28 104 33.37 104 40 L104 68 C104 81.25 93.25 92 80 92 L56 92 C36.12 92 20 75.88 20 56 Z"
        fill={color}
        transform="scale(0.85) translate(8, 6)"
      />
    </Svg>
  );
};

