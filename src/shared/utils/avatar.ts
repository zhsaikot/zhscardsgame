/**
 * Shared Avatar Utilities & Preset Demo Avatars for 29 Card Game
 * Available for both Server and Client environments
 */

export interface DemoAvatar {
  id: string;
  name: string;
  svgDataUri: string;
}

// Helper to convert SVG markup into a clean data URI
const svgToDataUri = (svgString: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
};

/* Demo Avatar 1: Executive Gentleman in Navy Suit (Reference Character) */
const svgAvatar1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg1" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg1)" stroke="#d4af37" stroke-width="4"/>
  <!-- Suit Body -->
  <path d="M22 118 C22 88 38 78 60 78 C82 78 98 88 98 118 Z" fill="#0f172a" />
  <!-- White Shirt & Tie -->
  <polygon points="60,78 50,95 60,118 70,95" fill="#f8fafc" />
  <polygon points="60,82 56,92 60,115 64,92" fill="#ef4444" />
  <!-- Neck -->
  <rect x="52" y="66" width="16" height="16" fill="#fbcfe8" rx="4"/>
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="20" ry="24" fill="#fcd34d" />
  <!-- Hair -->
  <path d="M38 45 C38 28 50 24 60 24 C72 24 82 28 82 42 C82 45 78 40 76 38 C70 34 50 34 44 38 C40 41 38 45 38 45 Z" fill="#451a03" />
  <!-- Eyes & Eyebrows -->
  <ellipse cx="53" cy="48" rx="2.5" ry="1.8" fill="#1e293b" />
  <ellipse cx="67" cy="48" rx="2.5" ry="1.8" fill="#1e293b" />
  <path d="M49 43 Q53 41 57 43" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M63 43 Q67 41 71 43" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Smile -->
  <path d="M54 60 Q60 65 66 60" stroke="#b45309" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`;

/* Demo Avatar 2: Casual Bearded Male (Reference Character) */
const svgAvatar2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg2" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#064e3b" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg2)" stroke="#d4af37" stroke-width="4"/>
  <!-- Shirt -->
  <path d="M22 118 C22 90 38 80 60 80 C82 80 98 90 98 118 Z" fill="#334155" />
  <circle cx="60" cy="80" r="8" fill="#fed7aa" />
  <!-- Neck -->
  <rect x="52" y="66" width="16" height="16" fill="#fed7aa" rx="4"/>
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="20" ry="24" fill="#fed7aa" />
  <!-- Hair & Beard -->
  <path d="M38 45 C38 28 50 25 60 25 C70 25 82 28 82 45 C82 48 76 38 60 36 C44 38 38 48 38 45 Z" fill="#292524" />
  <!-- Beard -->
  <path d="M42 54 C42 74 50 78 60 78 C70 78 78 74 78 54 C78 62 74 72 60 72 C46 72 42 62 42 54 Z" fill="#292524" />
  <!-- Eyes -->
  <ellipse cx="53" cy="48" rx="2.5" ry="1.8" fill="#1e293b" />
  <ellipse cx="67" cy="48" rx="2.5" ry="1.8" fill="#1e293b" />
  <!-- Smile -->
  <path d="M54 62 Q60 66 66 62" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`;

/* Demo Avatar 3: Elegant Professional Female (Reference Character) */
const svgAvatar3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg3" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#831843" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg3)" stroke="#d4af37" stroke-width="4"/>
  <!-- Dress -->
  <path d="M22 118 C22 92 38 82 60 82 C82 82 98 92 98 118 Z" fill="#701a75" />
  <path d="M46 82 Q60 98 74 82" fill="#fde047" opacity="0.3"/>
  <!-- Neck -->
  <rect x="54" y="66" width="12" height="16" fill="#fbcfe8" rx="4"/>
  <!-- Long Hair Behind -->
  <path d="M34 50 C34 75 36 95 44 105 C44 75 76 75 76 105 C84 95 86 75 86 50 Z" fill="#581c87" />
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="18" ry="22" fill="#fde047" />
  <!-- Hair Front -->
  <path d="M36 44 C36 26 48 24 60 24 C72 24 84 26 84 44 C84 48 76 34 60 34 C44 34 36 48 36 44 Z" fill="#3b0764" />
  <path d="M36 44 Q42 62 45 74 Q40 58 36 44" fill="#3b0764"/>
  <path d="M84 44 Q78 62 75 74 Q80 58 84 44" fill="#3b0764"/>
  <!-- Eyes -->
  <ellipse cx="53" cy="48" rx="2.5" ry="2" fill="#1e293b" />
  <ellipse cx="67" cy="48" rx="2.5" ry="2" fill="#1e293b" />
  <path d="M50 44 Q53 42 56 44" stroke="#3b0764" stroke-width="1.8" fill="none"/>
  <path d="M64 44 Q67 42 70 44" stroke="#3b0764" stroke-width="1.8" fill="none"/>
  <!-- Lips -->
  <path d="M54 61 Q60 66 66 61" stroke="#e11d48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>
`;

/* Demo Avatar 4: Young Casual Male (Reference Character) */
const svgAvatar4 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg4" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#9a3412" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg4)" stroke="#d4af37" stroke-width="4"/>
  <!-- T-Shirt -->
  <path d="M22 118 C22 90 38 80 60 80 C82 80 98 90 98 118 Z" fill="#0284c7" />
  <circle cx="60" cy="80" r="8" fill="#ffedd5" />
  <!-- Neck -->
  <rect x="52" y="66" width="16" height="16" fill="#ffedd5" rx="4"/>
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="19" ry="23" fill="#ffedd5" />
  <!-- Hair Modern Cut -->
  <path d="M38 42 C38 25 52 23 60 23 C70 23 82 25 82 40 C80 34 72 32 60 32 C46 32 40 36 38 42 Z" fill="#18181b" />
  <!-- Eyes -->
  <ellipse cx="53" cy="48" rx="2.5" ry="1.8" fill="#18181b" />
  <ellipse cx="67" cy="48" rx="2.5" ry="1.8" fill="#18181b" />
  <!-- Smile -->
  <path d="M54 60 Q60 65 66 60" stroke="#9a3412" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`;

/* Demo Avatar 5: Classic Gentleman / Card Maestro */
const svgAvatar5 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg5" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#581c87" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg5)" stroke="#d4af37" stroke-width="4"/>
  <!-- Tuxedo -->
  <path d="M22 118 C22 88 38 78 60 78 C82 78 98 88 98 118 Z" fill="#1e1b4b" />
  <polygon points="60,78 52,98 60,118 68,98" fill="#f8fafc" />
  <!-- Bow Tie -->
  <polygon points="54,82 66,82 60,86" fill="#d4af37" />
  <polygon points="54,90 66,90 60,86" fill="#d4af37" />
  <circle cx="60" cy="86" r="2.5" fill="#fef08a" />
  <!-- Head & Mustache -->
  <ellipse cx="60" cy="50" rx="19" ry="23" fill="#fde047" />
  <!-- Graying Hair -->
  <path d="M38 46 C38 28 50 24 60 24 C72 24 82 28 82 46 C80 36 70 34 60 34 C50 34 40 36 38 46 Z" fill="#475569" />
  <!-- Eyes -->
  <ellipse cx="53" cy="47" rx="2.5" ry="1.8" fill="#0f172a" />
  <ellipse cx="67" cy="47" rx="2.5" ry="1.8" fill="#0f172a" />
  <!-- Neat Mustache -->
  <path d="M52 59 Q60 56 68 59 Q60 62 52 59" fill="#334155" />
</svg>
`;

/* Demo Avatar 6: Stylish Professional Woman */
const svgAvatar6 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="bg6" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#0e7490" />
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg6)" stroke="#d4af37" stroke-width="4"/>
  <!-- Blazer -->
  <path d="M22 118 C22 90 38 80 60 80 C82 80 98 90 98 118 Z" fill="#b45309" />
  <polygon points="60,80 54,95 60,118 66,95" fill="#f8fafc" />
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="18" ry="22" fill="#fed7aa" />
  <!-- Stylish Short Bob Hair -->
  <path d="M36 48 C36 26 48 22 60 22 C74 22 84 26 84 48 C84 62 80 66 78 72 C74 54 72 34 60 34 C48 34 44 54 42 72 C40 66 36 62 36 48 Z" fill="#78350f" />
  <!-- Glasses -->
  <rect x="46" y="44" width="11" height="8" rx="2" fill="none" stroke="#d4af37" stroke-width="1.8"/>
  <rect x="63" y="44" width="11" height="8" rx="2" fill="none" stroke="#d4af37" stroke-width="1.8"/>
  <line x1="57" y1="48" x2="63" y2="48" stroke="#d4af37" stroke-width="1.8"/>
  <circle cx="51.5" cy="48" r="1.8" fill="#1e293b"/>
  <circle cx="68.5" cy="48" r="1.8" fill="#1e293b"/>
  <!-- Smile -->
  <path d="M55 61 Q60 65 65 61" stroke="#be123c" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`;

export const DEMO_AVATARS: DemoAvatar[] = [
  { id: 'avatar_1', name: 'Executive', svgDataUri: svgToDataUri(svgAvatar1) },
  { id: 'avatar_2', name: 'Casual Beard', svgDataUri: svgToDataUri(svgAvatar2) },
  { id: 'avatar_3', name: 'Professional Woman', svgDataUri: svgToDataUri(svgAvatar3) },
  { id: 'avatar_4', name: 'Young Player', svgDataUri: svgToDataUri(svgAvatar4) },
  { id: 'avatar_5', name: 'Gentleman', svgDataUri: svgToDataUri(svgAvatar5) },
  { id: 'avatar_6', name: 'Stylish Chic', svgDataUri: svgToDataUri(svgAvatar6) },
];

/**
 * Gets demo avatar by seat number for AI Bots
 */
export function getBotAvatar(seat: number): string {
  // Seat 2 = Vanguard (Avatar 1), Seat 3 = Artemis (Avatar 3), Seat 4 = Cipher (Avatar 2)
  if (seat === 2) return DEMO_AVATARS[0].svgDataUri;
  if (seat === 3) return DEMO_AVATARS[2].svgDataUri;
  if (seat === 4) return DEMO_AVATARS[1].svgDataUri;
  return DEMO_AVATARS[4].svgDataUri;
}

