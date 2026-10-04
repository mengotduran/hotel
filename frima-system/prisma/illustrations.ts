/**
 * Illustration set for the public site.
 *
 * These are flat vector interiors drawn in the property's palette, not
 * photographs. They exist so the site is presentable before the real photos
 * are taken, and they are meant to be replaced from /admin/content.
 */

export interface Palette {
  wall: string;
  wallDeep: string;
  floor: string;
  floorDeep: string;
  wood: string;
  woodDark: string;
  textile: string;
  textileDeep: string;
  accent: string;
  navy: string;
  navyDeep: string;
  sky: string;
  skyDeep: string;
  green: string;
}

export const PALETTES: Palette[] = [
  {
    wall: "#f0f2f6", wallDeep: "#dfe4ec", floor: "#cbae86", floorDeep: "#b2936b",
    wood: "#8d6c47", woodDark: "#6b5134", textile: "#fbf8f2", textileDeep: "#e7ded0",
    accent: "#c9a227", navy: "#1e3a5f", navyDeep: "#14283f",
    sky: "#cfe2f2", skyDeep: "#9ec4e2", green: "#4b7f63",
  },
  {
    wall: "#f3f1ec", wallDeep: "#e4e0d6", floor: "#c0a07c", floorDeep: "#a78761",
    wood: "#7f6241", woodDark: "#5e4830", textile: "#f6f1e8", textileDeep: "#ddd2bf",
    accent: "#c9a227", navy: "#22446c", navyDeep: "#16304f",
    sky: "#d8e7f3", skyDeep: "#a8cbe5", green: "#5a8a6c",
  },
  {
    wall: "#eef1f3", wallDeep: "#dce2e8", floor: "#b99c7b", floorDeep: "#9f8362",
    wood: "#86684a", woodDark: "#654d36", textile: "#f9f6f0", textileDeep: "#e3dacb",
    accent: "#d0ab33", navy: "#1b3758", navyDeep: "#132a44",
    sky: "#cbdff0", skyDeep: "#9bc0de", green: "#47785e",
  },
];

const W = 1600;
const H = 1200;
const FLOOR_Y = 830;

function defs(p: Palette, id: string): string {
  return `<defs>
    <linearGradient id="wall-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.wall}"/>
      <stop offset="1" stop-color="${p.wallDeep}"/>
    </linearGradient>
    <linearGradient id="floor-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.floorDeep}"/>
      <stop offset="1" stop-color="${p.floor}"/>
    </linearGradient>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyDeep}"/>
      <stop offset="1" stop-color="${p.sky}"/>
    </linearGradient>
    <linearGradient id="glow-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;
}

/** Floorboards receding toward the viewer · cheap depth, no gradient mush. */
function planks(p: Palette, floorY: number): string {
  return Array.from({ length: 7 }, (_, i) => {
    const t = (i + 1) / 8;
    const y = floorY + (H - floorY) * t * t;
    return `<line x1="0" y1="${y.toFixed(0)}" x2="${W}" y2="${y.toFixed(0)}" stroke="${p.floorDeep}" stroke-width="${1 + i * 0.6}" opacity="0.35"/>`;
  }).join("");
}

/** A soft contact shadow directly under a piece of furniture. */
function shadow(p: Palette, cx: number, cy: number, rx: number, ry = 18): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.navyDeep}" opacity="0.1"/>`;
}

/** `floorY` lets a large room start its floor higher, so seating and tables
 *  stand on the floor rather than floating against the wall. */
function shell(p: Palette, id: string, body: string, floorY = FLOOR_Y): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(p, id)}
  <rect width="${W}" height="${H}" fill="url(#wall-${id})"/>
  <rect y="${floorY}" width="${W}" height="${H - floorY}" fill="url(#floor-${id})"/>
  ${planks(p, floorY)}
  <rect y="${floorY - 18}" width="${W}" height="18" fill="${p.textileDeep}"/>
  ${body}
  <rect width="${W}" height="${H}" fill="url(#glow-${id})"/>
</svg>`;
}

/** A window with mullions and curtains · the light source in every scene. */
function window_(p: Palette, id: string, x: number, y: number, w: number, h: number): string {
  const mid = x + w / 2;
  return `
  <rect x="${x - 16}" y="${y - 16}" width="${w + 32}" height="${h + 32}" rx="6" fill="${p.textile}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky-${id})"/>
  <path d="M${x} ${y + h * 0.62} h${w} v${h * 0.38} h-${w} z" fill="${p.green}" opacity="0.35"/>
  <circle cx="${x + w * 0.72}" cy="${y + h * 0.2}" r="${w * 0.08}" fill="#ffffff" opacity="0.75"/>
  <rect x="${mid - 5}" y="${y}" width="10" height="${h}" fill="${p.textile}"/>
  <rect x="${x}" y="${y + h / 2 - 5}" width="${w}" height="10" fill="${p.textile}"/>
  <rect x="${x - 54}" y="${y - 28}" width="48" height="${h + 72}" rx="10" fill="${p.textileDeep}"/>
  <rect x="${x + w + 6}" y="${y - 28}" width="48" height="${h + 72}" rx="10" fill="${p.textileDeep}"/>`;
}

function lamp(p: Palette, x: number, y: number, s = 1): string {
  return `
  <rect x="${x - 4 * s}" y="${y - 70 * s}" width="${8 * s}" height="${70 * s}" fill="${p.woodDark}"/>
  <path d="M${x - 42 * s} ${y - 70 * s} h${84 * s} l-${16 * s} -${52 * s} h-${52 * s} z" fill="${p.accent}"/>
  <ellipse cx="${x}" cy="${y}" rx="${26 * s}" ry="${8 * s}" fill="${p.woodDark}"/>`;
}

function plant(p: Palette, x: number, y: number, s = 1): string {
  return `
  <path d="M${x - 34 * s} ${y} h${68 * s} l-${10 * s} ${54 * s} h-${48 * s} z" fill="${p.accent}" opacity="0.85"/>
  <path d="M${x} ${y} c-${10 * s} -${70 * s} -${60 * s} -${80 * s} -${54 * s} -${120 * s}
            c${34 * s} ${12 * s} ${50 * s} ${64 * s} ${54 * s} ${120 * s} z" fill="${p.green}"/>
  <path d="M${x} ${y} c${10 * s} -${80 * s} ${56 * s} -${74 * s} ${62 * s} -${112 * s}
            c-${36 * s} ${8 * s} -${56 * s} ${56 * s} -${62 * s} ${112 * s} z" fill="${p.green}" opacity="0.8"/>`;
}

function art(p: Palette, x: number, y: number, w: number, h: number): string {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${p.textile}"/>
  <rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" fill="${p.navy}" opacity="0.18"/>
  <path d="M${x + 14} ${y + h - 14} l${(w - 28) * 0.38} -${(h - 28) * 0.5} l${(w - 28) * 0.28} ${(h - 28) * 0.28}
           l${(w - 28) * 0.34} -${(h - 28) * 0.42} v${(h - 28) * 0.64} z" fill="${p.accent}" opacity="0.55"/>`;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

export function bedroom(p: Palette, id: string, twin = false): string {
  /**
   * Straight-on elevation, built back to front so the layers read as a bed:
   * headboard, then pillows against it, then the duvet, then the base.
   */
  const bed = (bx: number, bw: number) => {
    const pillowW = (bw - 90) / 2;
    return `
    ${shadow(p, bx + bw / 2, 884, bw / 2 + 30, 22)}
    <rect x="${bx}" y="368" width="${bw}" height="300" rx="18" fill="${p.wood}"/>
    <rect x="${bx + 20}" y="390" width="${bw - 40}" height="256" rx="10" fill="${p.woodDark}" opacity="0.28"/>
    <rect x="${bx + 30}" y="590" width="${pillowW}" height="92" rx="20" fill="${p.textile}"/>
    <rect x="${bx + bw / 2 + 15}" y="590" width="${pillowW}" height="92" rx="20" fill="${p.textile}"/>
    <rect x="${bx + 30}" y="590" width="${pillowW}" height="30" rx="15" fill="#ffffff" opacity="0.7"/>
    <rect x="${bx + bw / 2 + 15}" y="590" width="${pillowW}" height="30" rx="15" fill="#ffffff" opacity="0.7"/>
    <rect x="${bx - 16}" y="668" width="${bw + 32}" height="150" rx="14" fill="${p.textile}"/>
    <rect x="${bx - 16}" y="748" width="${bw + 32}" height="70" rx="14" fill="${p.navy}"/>
    <rect x="${bx - 16}" y="748" width="${bw + 32}" height="12" fill="${p.navyDeep}" opacity="0.5"/>
    <rect x="${bx - 22}" y="814" width="${bw + 44}" height="36" rx="8" fill="${p.woodDark}"/>
    <rect x="${bx - 6}" y="850" width="26" height="30" fill="${p.woodDark}"/>
    <rect x="${bx + bw - 20}" y="850" width="26" height="30" fill="${p.woodDark}"/>`;
  };

  const beds = twin ? bed(700, 340) + bed(1120, 340) : bed(720, 700);

  return shell(p, id, `
  ${window_(p, id, 150, 190, 390, 470)}
  ${art(p, 880, 150, 220, 170)}
  ${art(p, 1150, 150, 220, 170)}
  <ellipse cx="1060" cy="960" rx="470" ry="86" fill="${p.textileDeep}" opacity="0.6"/>
  <ellipse cx="1060" cy="960" rx="400" ry="68" fill="${p.navy}" opacity="0.1"/>
  ${beds}
  <rect x="${twin ? 1490 : 1450}" y="716" width="110" height="104" rx="8" fill="${p.wood}"/>
  ${shadow(p, (twin ? 1490 : 1450) + 55, 824, 70, 12)}
  ${lamp(p, (twin ? 1490 : 1450) + 55, 716, 0.72)}
  ${plant(p, 250, 820, 1.05)}
  ${shadow(p, 250, 880, 60, 12)}`);
}

export function workspace(p: Palette, id: string): string {
  return shell(p, id, `
  ${window_(p, id, 1080, 200, 400, 450)}
  <rect x="150" y="250" width="330" height="570" rx="10" fill="${p.wood}"/>
  <rect x="166" y="266" width="140" height="538" rx="6" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="322" y="266" width="142" height="538" rx="6" fill="${p.woodDark}" opacity="0.3"/>
  <circle cx="310" cy="540" r="7" fill="${p.accent}"/>
  <circle cx="334" cy="540" r="7" fill="${p.accent}"/>
  <rect x="560" y="300" width="250" height="330" rx="8" fill="${p.textile}"/>
  <rect x="578" y="318" width="214" height="294" rx="4" fill="${p.sky}" opacity="0.5"/>
  <rect x="600" y="640" width="430" height="24" rx="6" fill="${p.wood}"/>
  <rect x="612" y="664" width="18" height="156" fill="${p.woodDark}"/>
  <rect x="1000" y="664" width="18" height="156" fill="${p.woodDark}"/>
  <rect x="660" y="556" width="300" height="86" rx="6" fill="${p.navyDeep}"/>
  <rect x="674" y="568" width="272" height="62" rx="3" fill="${p.sky}" opacity="0.6"/>
  <rect x="750" y="642" width="120" height="12" fill="${p.navy}"/>
  ${lamp(p, 980, 640, 0.75)}
  <path d="M700 820 h200 l-14 -120 h-172 z" fill="${p.navy}" opacity="0.85"/>
  <rect x="784" y="820" width="26" height="60" fill="${p.navyDeep}"/>
  <ellipse cx="797" cy="884" rx="74" ry="14" fill="${p.navyDeep}"/>
  ${plant(p, 1520, 820, 1.1)}
  ${shadow(p, 1520, 880, 62, 12)}
  ${shadow(p, 810, 840, 230, 16)}`);
}

export function bathroom(p: Palette, id: string): string {
  const tiles = Array.from({ length: 9 }, (_, i) =>
    `<rect x="${60 + i * 170}" y="120" width="160" height="700" fill="${p.textile}" opacity="${i % 2 ? 0.55 : 0.3}"/>`,
  ).join("");

  return shell(p, id, `
  ${tiles}
  <rect x="140" y="200" width="420" height="620" rx="10" fill="${p.sky}" opacity="0.35"/>
  <rect x="140" y="200" width="420" height="620" rx="10" fill="none" stroke="${p.navy}" stroke-width="10" opacity="0.5"/>
  <rect x="330" y="200" width="10" height="620" fill="${p.navy}" opacity="0.35"/>
  <circle cx="250" cy="300" r="26" fill="${p.textile}"/>
  <rect x="244" y="300" width="12" height="90" fill="${p.textile}"/>
  <rect x="760" y="520" width="420" height="40" rx="10" fill="${p.textile}"/>
  <rect x="790" y="560" width="360" height="200" rx="8" fill="${p.wood}"/>
  <ellipse cx="970" cy="520" rx="130" ry="34" fill="${p.wallDeep}"/>
  <rect x="958" y="432" width="24" height="90" rx="8" fill="${p.accent}"/>
  <rect x="930" y="424" width="80" height="18" rx="9" fill="${p.accent}"/>
  <rect x="820" y="140" width="300" height="250" rx="8" fill="${p.sky}" opacity="0.5"/>
  <rect x="820" y="140" width="300" height="250" rx="8" fill="none" stroke="${p.textile}" stroke-width="14"/>
  <rect x="1260" y="300" width="18" height="300" rx="9" fill="${p.woodDark}"/>
  <rect x="1240" y="340" width="120" height="150" rx="8" fill="${p.textile}"/>
  <rect x="1240" y="500" width="120" height="120" rx="8" fill="${p.navy}" opacity="0.75"/>
  ${plant(p, 1480, 820, 0.85)}
  ${shadow(p, 1480, 872, 52, 10)}
  ${shadow(p, 970, 772, 200, 14)}`);
}

export function living(p: Palette, id: string): string {
  return shell(p, id, `
  ${window_(p, id, 1020, 170, 460, 520)}
  ${art(p, 230, 200, 300, 230)}
  <rect x="150" y="560" width="620" height="160" rx="22" fill="${p.navy}"/>
  <rect x="150" y="520" width="620" height="70" rx="20" fill="${p.navyDeep}"/>
  <rect x="178" y="548" width="170" height="60" rx="14" fill="${p.accent}" opacity="0.75"/>
  <rect x="368" y="548" width="170" height="60" rx="14" fill="${p.textile}" opacity="0.85"/>
  <rect x="558" y="548" width="170" height="60" rx="14" fill="${p.accent}" opacity="0.5"/>
  <rect x="150" y="712" width="40" height="80" fill="${p.navyDeep}"/>
  <rect x="730" y="712" width="40" height="80" fill="${p.navyDeep}"/>
  <ellipse cx="520" cy="880" rx="430" ry="76" fill="${p.textileDeep}" opacity="0.65"/>
  <ellipse cx="520" cy="880" rx="360" ry="60" fill="${p.navy}" opacity="0.09"/>
  <rect x="470" y="700" width="300" height="24" rx="8" fill="${p.wood}"/>
  <rect x="490" y="724" width="16" height="76" fill="${p.woodDark}"/>
  <rect x="734" y="724" width="16" height="76" fill="${p.woodDark}"/>
  <rect x="560" y="664" width="110" height="38" rx="6" fill="${p.accent}" opacity="0.8"/>
  <rect x="840" y="330" width="120" height="420" rx="10" fill="${p.wood}"/>
  ${lamp(p, 900, 330, 0.9)}
  ${plant(p, 1530, 820, 1.15)}`);
}

export function kitchenette(p: Palette, id: string): string {
  return shell(p, id, `
  ${window_(p, id, 1150, 200, 330, 330)}
  <rect x="120" y="180" width="760" height="190" rx="8" fill="${p.wood}"/>
  <rect x="140" y="200" width="230" height="150" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="385" y="200" width="230" height="150" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="630" y="200" width="230" height="150" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="120" y="540" width="760" height="36" rx="6" fill="${p.navyDeep}"/>
  <rect x="120" y="576" width="760" height="244" rx="6" fill="${p.wood}"/>
  <rect x="150" y="606" width="200" height="184" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="370" y="606" width="200" height="184" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="590" y="606" width="260" height="184" rx="5" fill="${p.woodDark}" opacity="0.3"/>
  <rect x="190" y="470" width="120" height="70" rx="6" fill="${p.textile}"/>
  <rect x="236" y="400" width="18" height="78" fill="${p.accent}"/>
  <rect x="206" y="392" width="78" height="16" rx="8" fill="${p.accent}"/>
  <circle cx="620" cy="558" r="26" fill="${p.navy}" opacity="0.5"/>
  <circle cx="700" cy="558" r="26" fill="${p.navy}" opacity="0.5"/>
  <rect x="930" y="430" width="190" height="390" rx="10" fill="${p.textile}"/>
  <rect x="930" y="586" width="190" height="10" fill="${p.wallDeep}"/>
  <rect x="1090" y="500" width="12" height="60" rx="6" fill="${p.navy}"/>
  <rect x="1090" y="640" width="12" height="60" rx="6" fill="${p.navy}"/>
  ${plant(p, 1300, 820, 0.95)}
  <rect x="1424" y="612" width="18" height="150" rx="8" fill="${p.navyDeep}"/>
  <rect x="1424" y="612" width="110" height="16" rx="8" fill="${p.navyDeep}"/>
  <ellipse cx="1480" cy="768" rx="66" ry="20" fill="${p.navy}"/>
  <rect x="1414" y="768" width="132" height="16" rx="8" fill="${p.navyDeep}"/>
  <rect x="1432" y="784" width="14" height="66" fill="${p.navyDeep}"/>
  <rect x="1514" y="784" width="14" height="66" fill="${p.navyDeep}"/>
  <rect x="1432" y="820" width="96" height="10" rx="5" fill="${p.navyDeep}" opacity="0.7"/>
  ${shadow(p, 1480, 856, 76, 12)}
  ${shadow(p, 500, 836, 400, 16)}`);
}

export function balconyView(p: Palette, id: string): string {
  return shell(p, id, `
  <rect x="220" y="120" width="1160" height="700" rx="12" fill="url(#sky-${id})"/>
  <path d="M220 560 h1160 v260 h-1160 z" fill="${p.green}" opacity="0.3"/>
  <path d="M220 640 q180 -90 380 -30 q200 60 400 -10 q200 -70 380 20 v200 h-1160 z" fill="${p.green}" opacity="0.4"/>
  <circle cx="1180" cy="250" r="64" fill="#ffffff" opacity="0.8"/>
  <rect x="200" y="100" width="34" height="740" fill="${p.textile}"/>
  <rect x="1366" y="100" width="34" height="740" fill="${p.textile}"/>
  <rect x="790" y="100" width="24" height="740" fill="${p.textile}"/>
  <rect x="200" y="100" width="1200" height="26" fill="${p.textile}"/>
  <rect x="240" y="690" width="1120" height="12" rx="6" fill="${p.navy}" opacity="0.65"/>
  <rect x="240" y="760" width="1120" height="12" rx="6" fill="${p.navy}" opacity="0.65"/>
  ${Array.from({ length: 13 }, (_, i) => `<rect x="${260 + i * 86}" y="690" width="10" height="130" fill="${p.navy}" opacity="0.45"/>`).join("")}
  <rect x="980" y="600" width="26" height="236" rx="8" fill="${p.woodDark}"/>
  <rect x="980" y="600" width="210" height="26" rx="10" fill="${p.wood}"/>
  <rect x="1000" y="626" width="170" height="14" rx="7" fill="${p.wood}" opacity="0.7"/>
  <rect x="966" y="716" width="240" height="30" rx="12" fill="${p.accent}"/>
  <rect x="978" y="746" width="20" height="90" fill="${p.woodDark}"/>
  <rect x="1174" y="746" width="20" height="90" fill="${p.woodDark}"/>
  ${shadow(p, 1086, 842, 130, 14)}
  <rect x="1240" y="700" width="130" height="22" rx="8" fill="${p.wood}"/>
  <rect x="1252" y="722" width="16" height="114" fill="${p.woodDark}"/>
  <rect x="1342" y="722" width="16" height="114" fill="${p.woodDark}"/>
  ${shadow(p, 1305, 842, 76, 11)}
  ${plant(p, 400, 820, 1.2)}
  ${shadow(p, 400, 888, 72, 13)}
  ${shadow(p, 1090, 884, 130, 14)}`);
}

export function conference(p: Palette, id: string): string {
  // Rows widen and drop as they come forward, each one centred on the room so
  // nothing runs off the canvas.
  const rows = Array.from({ length: 4 }, (_, r) => {
    const scale = 0.78 + r * 0.14;
    const y = 660 + r * 96 + r * r * 12;
    const gap = 118 * scale;
    const count = 9;
    const startX = W / 2 - ((count - 1) * gap) / 2 - (74 * scale) / 2;
    const fade = 0.62 + r * 0.12;

    return Array.from({ length: count }, (_, c) => {
      const x = startX + c * gap;
      return `<rect x="${x.toFixed(1)}" y="${y}" width="${(74 * scale).toFixed(1)}" height="${(54 * scale).toFixed(1)}" rx="10" fill="${p.navy}" opacity="${fade.toFixed(2)}"/>
              <rect x="${(x - 4 * scale).toFixed(1)}" y="${(y + 48 * scale).toFixed(1)}" width="${(82 * scale).toFixed(1)}" height="${(16 * scale).toFixed(1)}" rx="6" fill="${p.navyDeep}" opacity="${fade.toFixed(2)}"/>`;
    }).join("");
  }).join("");

  return shell(p, id, `
  <rect x="0" y="0" width="${W}" height="440" fill="${p.navyDeep}" opacity="0.06"/>
  <rect x="430" y="110" width="740" height="400" rx="10" fill="${p.navyDeep}"/>
  <rect x="452" y="132" width="696" height="356" rx="4" fill="${p.sky}" opacity="0.45"/>
  <path d="M452 488 l230 -190 l150 110 l190 -150 l126 230 z" fill="${p.accent}" opacity="0.35"/>
  <rect x="150" y="300" width="190" height="210" rx="8" fill="${p.accent}" opacity="0.45"/>
  <rect x="1260" y="300" width="190" height="210" rx="8" fill="${p.accent}" opacity="0.45"/>
  <rect x="210" y="556" width="170" height="30" rx="8" fill="${p.wood}"/>
  <rect x="282" y="586" width="26" height="76" fill="${p.woodDark}"/>
  ${shadow(p, 295, 664, 74, 12)}
  ${rows}`, 600);
}

export function boardroom(p: Palette, id: string): string {
  const chair = (x: number, y: number, s: number) => `
    <rect x="${x}" y="${y}" width="${70 * s}" height="${54 * s}" rx="10" fill="${p.navy}"/>
    <rect x="${x + 8 * s}" y="${y + 48 * s}" width="${54 * s}" height="${14 * s}" rx="6" fill="${p.navyDeep}"/>`;

  return shell(p, id, `
  ${window_(p, id, 1130, 190, 350, 400)}
  <rect x="330" y="120" width="620" height="340" rx="10" fill="${p.navyDeep}"/>
  <rect x="352" y="142" width="576" height="296" rx="4" fill="${p.sky}" opacity="0.4"/>
  ${[0, 1, 2, 3].map((i) => chair(250 + i * 250, 470, 1)).join("")}
  <ellipse cx="800" cy="690" rx="560" ry="150" fill="${p.wood}"/>
  <ellipse cx="800" cy="676" rx="560" ry="150" fill="${p.woodDark}" opacity="0.45"/>
  <ellipse cx="800" cy="668" rx="520" ry="130" fill="${p.wood}"/>
  ${[0, 1, 2, 3].map((i) => chair(220 + i * 260, 760, 1.15)).join("")}
  <rect x="640" y="620" width="120" height="70" rx="6" fill="${p.navyDeep}"/>
  <rect x="650" y="630" width="100" height="50" rx="3" fill="${p.sky}" opacity="0.5"/>
  <rect x="880" y="628" width="90" height="26" rx="6" fill="${p.textile}"/>
  <rect x="1000" y="620" width="60" height="44" rx="6" fill="${p.accent}" opacity="0.8"/>
  ${plant(p, 190, 820, 1.05)}
  ${shadow(p, 190, 880, 62, 12)}`);
}

export function eventSpace(p: Palette, id: string): string {
  const table = (cx: number, cy: number, s: number) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${150 * s}" ry="${54 * s}" fill="${p.textile}"/>
    <ellipse cx="${cx}" cy="${cy - 10 * s}" rx="${150 * s}" ry="${54 * s}" fill="#ffffff"/>
    <ellipse cx="${cx}" cy="${cy - 10 * s}" rx="${98 * s}" ry="${34 * s}" fill="${p.accent}" opacity="0.28"/>
    ${[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const x = cx + Math.cos(a) * 180 * s;
      const y = cy + Math.sin(a) * 66 * s;
      return `<rect x="${x - 26 * s}" y="${y - 30 * s}" width="${52 * s}" height="${46 * s}" rx="9" fill="${p.navy}" opacity="0.9"/>`;
    }).join("")}
    <rect x="${cx - 10 * s}" y="${cy - 74 * s}" width="${20 * s}" height="${44 * s}" fill="${p.accent}"/>`;

  return shell(p, id, `
  <rect x="0" y="0" width="${W}" height="620" fill="${p.navyDeep}" opacity="0.08"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${60 + i * 270}" y="60" width="150" height="700" rx="75" fill="${p.textileDeep}" opacity="0.65"/>`).join("")}
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `
    <line x1="${140 + i * 220}" y1="0" x2="${140 + i * 220}" y2="${150 + (i % 2) * 70}" stroke="${p.accent}" stroke-width="4" opacity="0.7"/>
    <circle cx="${140 + i * 220}" cy="${150 + (i % 2) * 70}" r="16" fill="${p.accent}"/>`).join("")}
  ${table(420, 790, 1.0)}
  ${table(1150, 770, 0.92)}
  ${table(790, 985, 1.22)}`, 620);
}

export type SceneFn = (p: Palette, id: string) => string;

export const SCENES: Record<string, SceneFn> = {
  bedroom: (p, id) => bedroom(p, id, false),
  bedroomTwin: (p, id) => bedroom(p, id, true),
  workspace,
  bathroom,
  living,
  kitchenette,
  balconyView,
  conference,
  boardroom,
  eventSpace,
};
