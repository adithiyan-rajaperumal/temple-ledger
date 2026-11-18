import React from 'react';

/**
 * Sacred Jain Symbol (Ahimsa Hand with 24-Spoke Dharmachakra,
 * Ratnatraya Three Jewels, and Siddhashila Crescent).
 * Specially designed for 1008 Sri Vrishabhanatha Jinalayam.
 */
export default function JainSymbolIcon({ className = 'w-6 h-6', ...props }) {
  // 12 diameter lines creating 24 radiating spokes for the 24 Tirthankaras
  const spokeAngles = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];

  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jain Ahimsa Symbol"
      role="img"
      {...props}
    >
      {/* 1. Siddhashila (Abode of Liberated Souls) & Siddha Dot */}
      <circle cx="50" cy="5" r="2.5" />
      <path
        d="M 33 10 Q 50 17 67 10 Q 50 13 33 10 Z"
      />

      {/* 2. Ratnatraya (Three Jewels: Right Faith, Right Knowledge, Right Conduct) */}
      <circle cx="41" cy="17" r="2.2" />
      <circle cx="50" cy="17" r="2.2" />
      <circle cx="59" cy="17" r="2.2" />

      {/* 3. Sacred Ahimsa Hand (Abhaya Mudra) with Cutout Palm */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 43 94
          C 43 94, 38 88, 33 80
          C 28 72, 22 64, 21 54
          C 20 46, 23 42, 28 43
          C 32 44, 34 50, 36 56
          C 36 51, 36 39, 36 27
          C 36 21, 43 21, 43 27
          L 43 32
          L 44 24
          C 44 18, 51 18, 51 24
          L 51 32
          L 52 26
          C 52 20, 59 20, 59 26
          L 59 36
          L 60 32
          C 60 26, 67 26, 67 32
          C 67 44, 70 54, 71 63
          C 72 73, 66 84, 57 94
          Z

          M 50 51
          A 15 15 0 1 0 50 81
          A 15 15 0 1 0 50 51
          Z
        "
      />

      {/* 4. Dharmachakra (Wheel of Dharma with 24 Spokes in Palm) */}
      <g transform="translate(50, 66)">
        {/* Outer Wheel Rim */}
        <circle
          cx="0"
          cy="0"
          r="14.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />

        {/* Central Hub */}
        <circle cx="0" cy="0" r="3.6" fill="currentColor" />

        {/* 24 Radiating Spokes representing the 24 Tirthankaras */}
        {spokeAngles.map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-14"
            x2="0"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
}
