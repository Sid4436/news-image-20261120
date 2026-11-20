// news-image-20261120 — one-day world news infographic, drawn by hand.
// Node 22, standard library only. No network, no randomness, no Date.
// Writes a deterministic 1024x1024 PNG to $MAKEFUN_OUTPUT_DIR/entry.png
// (defaults to ./out). All news content is baked in below as constants.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------------------
// 5x7 bitmap font, authored glyph by glyph. Each glyph is 7 rows of 5 bits.
// Only uppercase letters, digits and common punctuation are needed: every
// string drawn through this font is upper-cased first.
// ---------------------------------------------------------------------------
type Glyph = string[];

const FONT: Record<string, Glyph> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "•": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
};

const BLANK: Glyph = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

function glyphFor(ch: string): Glyph {
  return FONT[ch] ?? BLANK;
}

// ---------------------------------------------------------------------------
// Canvas: a plain RGB pixel buffer with shape primitives.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const PAPER: RGB = [248, 243, 230];
const INK: RGB = [17, 17, 17];
const NAVY: RGB = [27, 42, 74];
const RED: RGB = [179, 32, 44];
const WHITE: RGB = [255, 255, 255];
const GRAY: RGB = [90, 90, 88];
const CARD: RGB = [255, 255, 255];
const LINE: RGB = [60, 60, 58];

class Canvas {
  px: Uint8Array;
  constructor() {
    this.px = new Uint8Array(W * H * 3);
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.px[i * 3] = c[0];
      this.px[i * 3 + 1] = c[1];
      this.px[i * 3 + 2] = c[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }
  // Bresenham line, thickness in pixels.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      const half = Math.floor(t / 2);
      for (let a = -half; a < t - half; a++) {
        for (let b = -half; b < t - half; b++) this.set(x + a, y + b, c);
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
      }
    }
  }
  // Filled triangle via barycentric scan of its bounding box.
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minX = Math.min(x0, x1, x2);
    const maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
    if (d === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
        const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
        const g = 1 - a - b;
        if (a >= 0 && b >= 0 && g >= 0) this.set(x, y, c);
      }
    }
  }
  // --- text ---
  textWidth(s: string, scale: number): number {
    const up = s.toUpperCase();
    return up.length * 6 * scale - scale;
  }
  text(x: number, y: number, s: string, scale: number, c: RGB): void {
    const up = s.toUpperCase();
    let cx = x;
    for (const ch of up) {
      const g = glyphFor(ch);
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === "1") {
            this.rect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
  }
  textCentered(cx: number, y: number, s: string, scale: number, c: RGB): void {
    this.text(cx - Math.floor(this.textWidth(s, scale) / 2), y, s, scale, c);
  }
  // Word-wrap a string into lines that fit maxW. Returns the lines.
  wrap(s: string, scale: number, maxW: number): string[] {
    const words = s.toUpperCase().split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const trial = cur === "" ? w : cur + " " + w;
      if (this.textWidth(trial, scale) <= maxW || cur === "") {
        cur = trial;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur !== "") lines.push(cur);
    return lines;
  }
  textBlock(x: number, y: number, s: string, scale: number, maxW: number, c: RGB, lineGap: number): number {
    const lines = this.wrap(s, scale, maxW);
    let yy = y;
    for (const ln of lines) {
      this.text(x, yy, ln, scale, c);
      yy += 7 * scale + lineGap;
    }
    return yy;
  }
}

// ---------------------------------------------------------------------------
// Pictograms — one small drawn scene per story, inside a 110x110 box.
// ---------------------------------------------------------------------------
const GOLD: RGB = [212, 160, 23];
const BLUE: RGB = [46, 95, 163];
const GREEN: RGB = [14, 122, 62];
const TEAL: RGB = [14, 110, 140];
const ORANGE: RGB = [224, 110, 20];
const SKY: RGB = [135, 190, 220];
const DARK: RGB = [40, 40, 40];

function picMissiles(cv: Canvas, x: number, y: number): void {
  // Night sky, a bridge over a river, a missile streak and a burst.
  cv.rect(x, y, 110, 110, [24, 30, 54]);
  cv.circle(x + 88, y + 18, 9, [240, 230, 180]);
  // Bridge deck and arches.
  cv.rect(x + 6, y + 74, 98, 6, WHITE);
  cv.line(x + 14, y + 74, x + 30, y + 60, WHITE, 3);
  cv.line(x + 30, y + 60, x + 46, y + 74, WHITE, 3);
  cv.line(x + 64, y + 74, x + 80, y + 60, WHITE, 3);
  cv.line(x + 80, y + 60, x + 96, y + 74, WHITE, 3);
  // River.
  cv.rect(x + 6, y + 86, 98, 16, [50, 110, 170]);
  cv.line(x + 14, y + 92, x + 34, y + 92, WHITE, 2);
  cv.line(x + 60, y + 97, x + 88, y + 97, WHITE, 2);
  // Missile streak and burst.
  cv.line(x + 18, y + 52, x + 44, y + 26, [255, 200, 60], 3);
  cv.circle(x + 48, y + 22, 6, ORANGE);
  cv.line(x + 48, y + 10, x + 48, y + 34, ORANGE, 2);
  cv.line(x + 36, y + 22, x + 60, y + 22, ORANGE, 2);
  cv.line(x + 40, y + 14, x + 56, y + 30, ORANGE, 2);
  cv.line(x + 56, y + 14, x + 40, y + 30, ORANGE, 2);
}

function picJustice(cv: Canvas, x: number, y: number): void {
  // Scales of justice on a pale background.
  cv.rect(x, y, 110, 110, [238, 228, 200]);
  cv.rect(x + 52, y + 14, 6, 78, INK);
  cv.rect(x + 38, y + 92, 34, 6, INK);
  cv.line(x + 14, y + 24, x + 96, y + 24, INK, 4);
  cv.circle(x + 55, y + 12, 5, GOLD);
  // Left pan.
  cv.line(x + 22, y + 24, x + 14, y + 52, INK, 2);
  cv.line(x + 22, y + 24, x + 30, y + 52, INK, 2);
  cv.tri(x + 10, y + 52, x + 34, y + 52, x + 22, y + 66, GOLD);
  // Right pan.
  cv.line(x + 88, y + 24, x + 80, y + 52, INK, 2);
  cv.line(x + 88, y + 24, x + 96, y + 52, INK, 2);
  cv.tri(x + 76, y + 52, x + 100, y + 52, x + 88, y + 66, GOLD);
  // Gavel base.
  cv.rect(x + 42, y + 98, 26, 4, INK);
}

function picSummit(cv: Canvas, x: number, y: number): void {
  // Three flags on poles above a table.
  cv.rect(x, y, 110, 110, [226, 236, 244]);
  const flags: RGB[] = [[179, 32, 44], [30, 90, 160], [200, 40, 40]];
  const tops = [18, 12, 18];
  for (let i = 0; i < 3; i++) {
    const px = x + 18 + i * 34;
    cv.rect(px, y + tops[i], 3, 66, INK);
    cv.rect(px + 3, y + tops[i], 26, 16, flags[i]);
    cv.rect(px + 3, y + tops[i] + 16, 26, 3, WHITE);
  }
  // Stars on the middle flag.
  cv.circle(x + 18 + 34 + 10, y + 12 + 8, 2, GOLD);
  cv.circle(x + 18 + 34 + 18, y + 12 + 8, 2, GOLD);
  // Table.
  cv.rect(x + 10, y + 84, 90, 6, INK);
  cv.rect(x + 16, y + 90, 5, 14, INK);
  cv.rect(x + 89, y + 90, 5, 14, INK);
}

function picMarkets(cv: Canvas, x: number, y: number): void {
  // Rising chart with an arrow, on a green-tinted board.
  cv.rect(x, y, 110, 110, [224, 240, 226]);
  cv.rect(x + 14, y + 16, 82, 78, WHITE);
  cv.line(x + 14, y + 94, x + 96, y + 94, INK, 2);
  cv.line(x + 14, y + 94, x + 14, y + 16, INK, 2);
  // Bars.
  cv.rect(x + 24, y + 74, 10, 20, [150, 180, 160]);
  cv.rect(x + 40, y + 64, 10, 30, [120, 165, 140]);
  cv.rect(x + 56, y + 56, 10, 38, [70, 145, 110]);
  cv.rect(x + 72, y + 44, 10, 50, GREEN);
  // Rising arrow.
  cv.line(x + 22, y + 66, x + 44, y + 52, RED, 4);
  cv.line(x + 44, y + 52, x + 64, y + 40, RED, 4);
  cv.line(x + 64, y + 40, x + 88, y + 24, RED, 4);
  cv.tri(x + 88, y + 24, x + 76, y + 26, x + 86, y + 36, RED);
}

function picTower(cv: Canvas, x: number, y: number): void {
  // A tall tower with a flame at its crown, desert dusk behind.
  cv.rect(x, y, 110, 110, [250, 214, 170]);
  cv.rect(x + 40, y + 30, 30, 66, [70, 70, 78]);
  cv.rect(x + 46, y + 20, 18, 12, [70, 70, 78]);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      cv.rect(x + 45 + c * 11, y + 36 + r * 11, 6, 6, GOLD);
    }
  }
  // Flame above the crown.
  cv.tri(x + 55, y + 4, x + 47, y + 22, x + 63, y + 22, ORANGE);
  cv.tri(x + 55, y + 10, x + 50, y + 22, x + 60, y + 22, RED);
  // Ground and a small tanker on the sea below.
  cv.rect(x, y + 96, 110, 14, [60, 110, 160]);
  cv.rect(x + 8, y + 88, 26, 8, DARK);
  cv.rect(x + 14, y + 82, 6, 6, DARK);
}

function picStorm(cv: Canvas, x: number, y: number): void {
  // Storm cloud, rain and waves.
  cv.rect(x, y, 110, 110, [214, 228, 238]);
  cv.circle(x + 38, y + 38, 20, [90, 100, 115]);
  cv.circle(x + 62, y + 34, 24, [110, 120, 135]);
  cv.circle(x + 78, y + 44, 16, [90, 100, 115]);
  cv.rect(x + 20, y + 48, 76, 12, [110, 120, 135]);
  // Rain.
  for (let i = 0; i < 5; i++) {
    const rx = x + 26 + i * 15;
    cv.line(rx, y + 66, rx - 5, y + 80, [30, 90, 160], 3);
  }
  // Waves.
  cv.line(x + 8, y + 92, x + 30, y + 86, TEAL, 4);
  cv.line(x + 30, y + 86, x + 52, y + 92, TEAL, 4);
  cv.line(x + 52, y + 92, x + 74, y + 86, TEAL, 4);
  cv.line(x + 74, y + 86, x + 96, y + 92, TEAL, 4);
  cv.line(x + 8, y + 102, x + 30, y + 96, TEAL, 4);
  cv.line(x + 30, y + 96, x + 52, y + 102, TEAL, 4);
  cv.line(x + 52, y + 102, x + 74, y + 96, TEAL, 4);
  cv.line(x + 74, y + 96, x + 96, y + 102, TEAL, 4);
}

// ---------------------------------------------------------------------------
// The day's stories. Every fact below was verified against reporting
// published on Friday 20 November 2026 (see README for sources).
// ---------------------------------------------------------------------------
interface Story {
  kicker: string;
  color: RGB;
  headline: string;
  summary: string;
  place: string;
  pic: (cv: Canvas, x: number, y: number) => void;
}

const STORIES: Story[] = [
  {
    kicker: "UKRAINE",
    color: BLUE,
    headline: "KYIV HIT BY MISSILES OVERNIGHT",
    summary:
      "Russia fired ballistic missiles at the capital, damaging three bridges over the Dnipro river.",
    place: "KYIV, UKRAINE",
    pic: picMissiles,
  },
  {
    kicker: "JUSTICE",
    color: [122, 92, 0],
    headline: "UN COURT: MYANMAR GUILTY OF GENOCIDE",
    summary:
      "The Hague rules the 2017 campaign against the Rohingya was genocide; survivors cheer the verdict.",
    place: "THE HAGUE, NETHERLANDS",
    pic: picJustice,
  },
  {
    kicker: "DIPLOMACY",
    color: NAVY,
    headline: "TRUMP, XI AND PUTIN ISSUE PEACE DECLARATION",
    summary:
      "First three-way summit in Shenzhen ends with a four-point declaration toward peace.",
    place: "SHENZHEN, CHINA",
    pic: picSummit,
  },
  {
    kicker: "MARKETS",
    color: GREEN,
    headline: "ANTHROPIC SOARS IN RECORD IPO DEBUT",
    summary:
      "The AI firm's shares jump on Wall Street as world stocks slide for a fifth straight day.",
    place: "NEW YORK, USA",
    pic: picMarkets,
  },
  {
    kicker: "GULF",
    color: RED,
    headline: "MISSILE HITS RIYADH'S TALLEST TOWER",
    summary:
      "Houthi missiles damage Riyadh's tallest tower; two tankers hit mines and burn near Hormuz.",
    place: "RIYADH, SAUDI ARABIA",
    pic: picTower,
  },
  {
    kicker: "WEATHER",
    color: TEAL,
    headline: "CYCLONE AKVAN: INDIA MOVES 47,000",
    summary:
      "Odisha evacuates 47,000 people as the cyclone closes on the east coast.",
    place: "EAST COAST, INDIA",
    pic: picStorm,
  },
];

// ---------------------------------------------------------------------------
// Layout: masthead, date strip, then a 2x3 grid of story cards.
// ---------------------------------------------------------------------------
function draw(cv: Canvas): void {
  // Masthead band.
  cv.rect(0, 0, W, 108, NAVY);
  cv.textCentered(W / 2, 22, "THE WORLD IN ONE DAY", 5, WHITE);
  cv.rect(24, 92, W - 48, 3, GOLD);
  // Date strip.
  cv.textCentered(W / 2, 122, "FRIDAY 20 NOVEMBER 2026", 4, RED);
  cv.textCentered(W / 2, 162, "SIX STORIES THAT DEFINED THE DAY", 2, GRAY);
  cv.line(24, 188, W - 24, 188, LINE, 2);

  // Story grid.
  const margin = 24;
  const gutter = 12;
  const colW = Math.floor((W - margin * 2 - gutter) / 2); // 482
  const rowH = 252;
  const gridTop = 200;
  for (let i = 0; i < STORIES.length; i++) {
    const s = STORIES[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (colW + gutter);
    const y = gridTop + row * (rowH + gutter);

    // Card.
    cv.rect(x, y, colW, rowH, CARD);
    cv.rect(x, y, colW, 2, LINE);
    cv.rect(x, y + rowH - 2, colW, 2, LINE);
    cv.rect(x, y, 2, rowH, LINE);
    cv.rect(x + colW - 2, y, 2, rowH, LINE);
    // Kicker strip.
    cv.rect(x + 2, y + 2, colW - 4, 30, s.color);
    cv.text(x + 14, y + 11, s.kicker, 2, WHITE);
    cv.text(x + colW - 14 - cv.textWidth("20 NOV 2026", 2), y + 11, "20 NOV 2026", 2, WHITE);

    // Pictogram.
    const picX = x + 14;
    const picY = y + 44;
    s.pic(cv, picX, picY);
    cv.rect(picX, picY, 110, 2, LINE);
    cv.rect(picX, picY + 108, 110, 2, LINE);
    cv.rect(picX, picY, 2, 110, LINE);
    cv.rect(picX + 108, picY, 2, 110, LINE);

    // Headline beside the pictogram (up to 3 lines, scale 3).
    const headX = picX + 110 + 14;
    const headW = x + colW - 14 - headX;
    cv.textBlock(headX, picY + 4, s.headline, 3, headW, INK, 4);

    // Summary below the pictogram row.
    const sumY = picY + 110 + 12;
    cv.textBlock(x + 14, sumY, s.summary, 2, colW - 28, INK, 3);

    // Place tag at the bottom of the card.
    cv.line(x + 14, y + rowH - 26, x + colW - 14, y + rowH - 26, [200, 196, 184], 1);
    cv.text(x + 14, y + rowH - 20, s.place, 2, GRAY);
  }

  // Footer.
  const footY = gridTop + 3 * rowH + 2 * gutter + 8;
  cv.line(24, footY, W - 24, footY, LINE, 2);
  cv.textCentered(
    W / 2,
    footY + 10,
    "ONE DAY, SIX STORIES - FRIDAY 20 NOVEMBER 2026",
    2,
    GRAY,
  );
}

// ---------------------------------------------------------------------------
// PNG encoding: raw RGB, filter 0, zlib DEFLATE, correct CRC32 per chunk.
// Deterministic: same pixels in, same bytes out, every run.
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw scanlines: one filter byte (0) + W*3 bytes each.
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(cv.px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
  mkdirSync(outDir, { recursive: true });
  const cv = new Canvas();
  draw(cv);
  const png = encodePNG(cv);
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
