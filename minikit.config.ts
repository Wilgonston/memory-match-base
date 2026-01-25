// Mini App configuration for BASE App integration
const ROOT_URL = import.meta.env.VITE_APP_URL || 'https://memory-match-base.app';

export const minikitConfig = {
  miniapp: {
    version: "1",
    name: "Memory Match BASE",
    subtitle: "Test your memory with BASE projects",
    description: "Classic memory card game featuring BASE blockchain ecosystem projects. Match pairs, complete 100 levels, and master the BASE ecosystem!",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/gameplay.svg`,
      `${ROOT_URL}/screenshots/level-select.svg`
    ],
    iconUrl: `${ROOT_URL}/assets/miniapp/icon-512.svg`,
    splashImageUrl: `${ROOT_URL}/assets/miniapp/splash.svg`,
    splashBackgroundColor: "#0052FF", // BASE blue
    homeUrl: ROOT_URL,
    primaryCategory: "games",
    tags: ["memory", "game", "base", "crypto", "puzzle", "blockchain"],
    heroImageUrl: `${ROOT_URL}/assets/miniapp/hero.svg`,
    tagline: "Master the BASE ecosystem through memory!",
    ogTitle: "Memory Match BASE - Blockchain Memory Game",
    ogDescription: "Test your memory with BASE blockchain projects. 100 levels of crypto fun!",
    ogImageUrl: `${ROOT_URL}/assets/miniapp/og-image.svg`,
  },
} as const;
