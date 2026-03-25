import heroImage from '../../assets/hero-shot.png'
import { DISCORD_URL, ITCH_URL, NEWSLETTER_URL } from '../router'

export const homeHero = {
  eyebrow: 'Bloom Cannon Browser Game',
  title: 'Cultivate your perfect run.',
  description: 'Play in the browser, place each bloom carefully, and build a calm garden board that survives one more turn.',
  primaryCta: { label: 'Play Now', href: '/play#game' },
  secondaryCta: { label: 'Play on itch.io', href: ITCH_URL },
  supportNote: 'Zero install, quick to read, and the guide, updates, and support paths stay visible below the hero.',
  quickFacts: ['Zero install', 'Deep strategy', 'Clear support path'],
  media: {
    src: heroImage,
    alt: 'Perfect Drop gameplay showing the garden board, bowl area, and merge pieces',
  },
}

export const featureCards = [
  {
    title: 'Read the board quickly',
    body: 'The bowl, next bloom, and danger state stay clear so a first-time player can understand the loop without reading a long wall of text.',
  },
  {
    title: 'Made for one more run',
    body: 'Short sessions, fast restarts, and a gentle difficulty curve make the browser version easy to try immediately and revisit later.',
  },
  {
    title: 'Structured like a real game site',
    body: 'Guide, updates, support, and screenshots stay visible on the homepage so the play-first layout still feels complete and trustworthy.',
  },
]

export const screenshots = [
  {
    src: heroImage,
    alt: 'Perfect Drop screenshot showing the main gameplay board and UI',
    title: 'Focused board view',
    caption: 'A clear layout that explains the game state without extra clutter.',
  },
  {
    src: heroImage,
    alt: 'Perfect Drop screenshot showing merge progression and larger garden pieces',
    title: 'Readable progression',
    caption: 'Each merge step is easy to track, making long runs satisfying to follow.',
  },
  {
    src: heroImage,
    alt: 'Perfect Drop screenshot showing late run tension and stacked pieces',
    title: 'Late-run tension',
    caption: 'The board tightens gradually, creating a calm but meaningful score chase.',
  },
]

export const homeIntro = {
  title: 'A browser game first, with the rest of the site close behind',
  body: [
    'Perfect Drop is built to let a new visitor start a run quickly, then learn more only if they want extra detail. The homepage leads with the browser game instead of asking players to read through every section first.',
    'That play-first hierarchy still keeps real supporting content in reach. Players can move into the guide, recent updates, screenshots, and support information without the site feeling thin or misleading.',
  ],
}

export const homeSupportCards = [
  {
    eyebrow: 'Guide',
    title: 'Rules and strategy stay easy to find',
    body: 'New players can jump straight into the browser version first, then use the guide for controls, failure conditions, and cleaner long-run habits.',
    cta: { label: 'Read Guide', href: '/guide' },
  },
  {
    eyebrow: 'Updates',
    title: 'Recent changes are visible on the homepage',
    body: 'Returning players can scan recent improvements without the update feed taking attention away from the main play action at the top.',
    cta: { label: 'View Updates', href: '/updates' },
  },
  {
    eyebrow: 'Support',
    title: 'Support paths stay clearly separated',
    body: 'itch.io and future community links remain available as real support options, not as competing first-screen actions or ad-like prompts.',
    cta: { label: 'Support Page', href: '/support' },
  },
]

export const updates = [
  {
    title: 'Update 1.1 – Improved physics',
    date: 'March 19, 2026',
    summary: 'Adjusted collision handling and settling behavior so shots feel steadier while keeping the score chase readable.',
  },
  {
    title: 'New final stage added',
    date: 'March 12, 2026',
    summary: 'Added a stronger final merge payoff so late runs feel more memorable and visually distinct.',
  },
  {
    title: 'UI and controls update',
    date: 'March 4, 2026',
    summary: 'Refined the HUD, restart flow, and control clarity for both mobile and desktop play sessions.',
  },
]

export const faqs = [
  {
    question: 'Can I play right away in the browser?',
    answer: 'Yes. The browser version is the main entry point, and the home page is designed to push visitors directly toward play first.',
  },
  {
    question: 'Do I need to read the guide before playing?',
    answer: 'No. The guide exists for players who want the rules, failure conditions, and strategy written out more clearly.',
  },
  {
    question: 'Why include itch.io if the game is playable here?',
    answer: 'Itch.io supports follow, revisit, and support flows without distracting from the first browser-play experience.',
  },
]

export const playPageCopy = {
  heading: 'Play Perfect Drop',
  description: 'The game area stays first, the controls stay close, and the next actions after a run stay obvious.',
  controls: [
    'Drag to aim.',
    'Release to drop the current bloom.',
    'Merge matching blooms to grow larger forms.',
    'Keep the workbench clear to avoid ending the run.',
  ],
  ctas: [
    { label: 'Play Again', type: 'restart' as const },
    { label: 'Read Guide', href: '/guide' },
    { label: 'Support on itch.io', href: ITCH_URL },
  ],
}

export const guideContent = {
  introduction:
    'Perfect Drop is a garden-themed merge game about managing space, planning drops, and turning small setups into stable long runs.',
  goal:
    'Merge matching blooms into larger forms, keep the board healthy, and score as much as possible before the work area fills up.',
  controls: [
    {
      title: 'Desktop',
      body: 'Click and drag to aim, then release to drop the current bloom.',
    },
    {
      title: 'Mobile',
      body: 'Touch, drag, and release in landscape mode for a wider, more comfortable board view.',
    },
  ],
  basicRules: [
    'Only matching bloom types merge together.',
    'Each merge creates a larger piece that changes future space management.',
    'The board shape matters as much as the next immediate score.',
  ],
  failureCondition:
    'A run ends when the board state becomes unsafe and the work area can no longer be managed cleanly.',
  beginnerTips: [
    'Use side space early so the center stays flexible.',
    'Think about the next bloom before taking the current shot.',
    'Let moving pieces settle before rushing the next drop.',
  ],
  commonMistakes: [
    'Stacking the center too early and cutting off safe angles.',
    'Chasing one big merge while ignoring lower-board stability.',
    'Dropping too quickly after rebounds without reading the new shape.',
  ],
  advancedStrategy: [
    {
      title: 'Preserve shape before greed',
      body: 'The best runs usually come from maintaining useful board geometry, not from forcing a single high-value merge too early.',
    },
    {
      title: 'Set up delayed chains',
      body: 'Sometimes the strongest move is leaving near-matches apart for one turn so the next bloom creates a safer multi-step payoff.',
    },
    {
      title: 'Protect the lower half',
      body: 'If the base of the stack is unstable, late-run options shrink quickly. Strong boards are built from the bottom upward.',
    },
  ],
}

export const supportContent = {
  title: 'Support Perfect Drop',
  description: 'If you enjoy the browser version, itch.io is the cleanest next step for support, follow, and future project growth.',
  itchCta: { label: 'Support on itch.io', href: ITCH_URL },
  futurePlans: [
    'Additional stage polish and stronger endgame reward presentation.',
    'Expanded audio settings and more refined feedback systems.',
    'Better revisit hooks through events, updates, and community touchpoints.',
  ],
  channels: [
    { label: 'Email updates placeholder', href: NEWSLETTER_URL },
    { label: 'Discord placeholder', href: DISCORD_URL },
  ],
}

export const privacyContent = {
  notice:
    'This site may collect limited operational information needed to run, improve, and maintain the web game experience.',
  cookies:
    'The structure is ready for cookies, analytics, or similar tools later. If those are added, this page should describe what is used and why.',
  contact:
    'For now, contact can be handled through the project email placeholder until a dedicated support address is finalized.',
}
