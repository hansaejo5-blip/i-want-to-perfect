import heroImage from '../../assets/hero-shot.png'
import { DISCORD_URL, ITCH_URL, NEWSLETTER_URL } from '../router'

export const homeHero = {
  eyebrow: 'Free Flower Merge Browser Game',
  title: 'Play Perfect Drop online and chase a cleaner run.',
  description:
    'Perfect Drop is a free browser merge game where you drop matching flowers, build chain reactions, and survive one more turn without installing anything.',
  primaryCta: { label: 'Play Now', href: '/play#game' },
  secondaryCta: { label: 'Play on itch.io', href: ITCH_URL },
  supportNote: 'No download, fast restarts, and clear guide, update, and support paths for players coming from search or social links.',
  quickFacts: ['Free to play', 'No download', 'Live leaderboard'],
  media: {
    src: heroImage,
    alt: 'Perfect Drop gameplay showing the garden board, bowl area, and merge pieces',
  },
}

export const featureCards = [
  {
    title: 'Easy to read in seconds',
    body: 'The board, next flower, and danger state stay clear so a new player can understand the merge loop almost immediately.',
  },
  {
    title: 'Built for one more run',
    body: 'Short sessions, fast restarts, and a smooth difficulty curve make the game easy to try once and revisit later for a higher score.',
  },
  {
    title: 'More than a thin play page',
    body: 'Guide, updates, support, screenshots, leaderboard context, and progression details stay visible so the site feels like a real game home instead of a single empty landing page.',
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
  title: 'A free online merge game with enough context to rank and convert',
  body: [
    'Perfect Drop is a free flower merge browser game built for fast first-time play. A visitor can start a run quickly, understand the controls, and see what the game is about without downloading anything.',
    'The site still gives Google and human visitors enough real information to trust the project. Players can move into the guide, recent updates, screenshots, leaderboard details, and support information without the site feeling thin.',
  ],
}

export const homeSupportCards = [
  {
    eyebrow: 'Guide',
    title: 'Rules and strategy stay easy to find',
    body: 'New players can jump into the browser game first, then use the guide for controls, failure conditions, scoring habits, reward flow, and smarter long-run setups.',
    cta: { label: 'Read Guide', href: '/guide' },
  },
  {
    eyebrow: 'Updates',
    title: 'Recent changes are visible on the homepage',
    body: 'Returning players can scan recent gameplay, physics, progression, and interface improvements without the update feed taking attention away from the play button.',
    cta: { label: 'View Updates', href: '/updates' },
  },
  {
    eyebrow: 'Support',
    title: 'Support paths stay clearly separated',
    body: 'itch.io and future community links remain available as real support options, not as confusing first-screen detours.',
    cta: { label: 'Support Page', href: '/support' },
  },
]

export const updates = [
  {
    title: 'Update 1.5 – Rotating daily board and cleaner hub HUD',
    date: 'March 28, 2026',
    summary: 'Daily quests now rotate by day, reset automatically, and the hub trims redundant cosmetic labels so the play, reward, and savings loop reads faster.',
  },
  {
    title: 'Update 1.4 – Growth hub and live event timer',
    date: 'March 28, 2026',
    summary: 'Rebuilt the home hub around level growth, daily targets, emerald income, and a real countdown event with active reward bonuses.',
  },
  {
    title: 'Update 1.3 – Market balance and first cosmetic path',
    date: 'March 24, 2026',
    summary: 'Adjusted emerald pacing so the first purchase feels reachable, then added Moonlit Greenhouse and Dewdrop Seed Set as meaningful spend choices.',
  },
  {
    title: 'Update 1.2 – Improved physics and play flow',
    date: 'March 19, 2026',
    summary: 'Adjusted collision handling and settling behavior so flower drops feel steadier while keeping the score chase readable.',
  },
  {
    title: 'Update 1.1 – UI and controls update',
    date: 'March 4, 2026',
    summary: 'Refined the HUD, restart flow, mobile control clarity, and leaderboard framing for both desktop and handheld browser sessions.',
  },
]

export const faqs = [
  {
    question: 'Can I play Perfect Drop right away in the browser?',
    answer: 'Yes. Perfect Drop is a free browser game, and the main play page opens without a download or account requirement.',
  },
  {
    question: 'Do I need to read the guide before playing?',
    answer: 'No. You can start immediately, then use the guide later for rules, failure conditions, scoring, rewards, and strategy tips.',
  },
  {
    question: 'What kind of game is Perfect Drop?',
    answer: 'It is a flower merge puzzle game for the browser. You drop matching flowers, make larger forms, and try to survive longer for a better score.',
  },
  {
    question: 'Why include itch.io if the game is playable here?',
    answer: 'Itch.io supports follow, revisit, and support flows without distracting from the main browser-play experience.',
  },
]

export const playPageCopy = {
  heading: 'Play Perfect Drop',
  description: 'Play the free flower merge game in your browser, beat the daily target, climb the leaderboard, and push your growth loop in the same session.',
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
    'Perfect Drop is a flower merge browser game about managing space, planning drops, and turning small setups into stable long runs.',
  goal:
    'Merge matching flowers into larger forms, keep the board healthy, and score as much as possible before the work area fills up.',
  controls: [
    {
      title: 'Desktop',
      body: 'Click and drag to aim, then release to drop the current bloom.',
    },
    {
      title: 'Mobile',
      body: 'Touch, drag, and release in landscape mode for a wider and more comfortable board view.',
    },
  ],
  basicRules: [
    'Only matching bloom types merge together.',
    'Each merge creates a larger piece that changes future space management.',
    'The board shape matters as much as the next immediate score.',
  ],
  failureCondition:
    'A run ends when the board state becomes unsafe and the work area can no longer be managed cleanly enough to place new flowers.',
  scoring: [
    'Every merge gives score based on the resulting bloom tier.',
    'Cleaner chains create stronger combo pressure and better run pacing.',
    'Higher scores also increase XP gains after the run ends.',
  ],
  rewards: [
    'Each completed run grants XP based on score, merges, and combo quality.',
    'Daily targets pay emeralds and are the fastest route to early cosmetic purchases.',
    'Level ups also award emeralds, so long-term play keeps feeding the market loop.',
  ],
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
  description: 'If you enjoy the browser version, itch.io is the cleanest next step for support, follow, and future growth for Perfect Drop. This page also explains where project updates and contact paths live.',
  itchCta: { label: 'Support on itch.io', href: ITCH_URL },
  futurePlans: [
    'Additional stage polish and stronger endgame reward presentation.',
    'Expanded reward hooks, market content, and event rotation.',
    'Better revisit hooks through updates, support channels, and community touchpoints.',
  ],
  channels: [
    { label: 'Email updates placeholder', href: NEWSLETTER_URL },
    { label: 'Discord placeholder', href: DISCORD_URL },
  ],
}

export const privacyContent = {
  notice:
    'This site stores limited local information such as run history, progression, and cosmetic state so the game hub can remember your level, daily progress, and owned items between sessions.',
  cookies:
    'The structure is ready for cookies, analytics, or similar tools later. If those are added, this page should describe what is used, why it is needed, and how to opt out where possible.',
  contact:
    'For now, contact can be handled through the project email placeholder until a dedicated support address is finalized.',
}
