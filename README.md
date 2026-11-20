# news-image-20261120

[![news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120)
[![news-image-20261120](https://make.fun/badge/news-image-20261120/Sid4436/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120)
[![news-image-20261120](https://make.fun/badge/news-image-20261120/Sid4436/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120)

A newspaper-style infographic summing up the world's news of **Friday 20 November 2026** in one image: six stories that defined the day, from Kyiv to Riyadh.

`main.ts` (Node 22, standard library only, no network) draws the whole image by hand — an embedded 5x7 bitmap font, shape primitives, and a manual PNG encoder (zlib DEFLATE + CRC32). All news content is baked into the code as constants, and every run writes byte-identical output.

## The six stories

1. **UKRAINE — Kyiv hit by missiles overnight.** Russia fired ballistic missiles at the capital, damaging three bridges over the Dnipro river. (Reported 20 Nov 2026; en.h.ua, Daily Baku)
2. **JUSTICE — UN court: Myanmar guilty of genocide.** The International Court of Justice ruled the 2017 campaign against the Rohingya was genocide. (The Hindu, 20 Nov 2026; BBC/Le Monde)
3. **DIPLOMACY — Trump, Xi and Putin issue peace declaration.** The first three-way summit in Shenzhen ended with a four-point declaration toward peace. (The Hindu, 20 Nov 2026; Le Monde)
4. **MARKETS — Anthropic soars in record IPO debut.** The AI firm's shares jumped on Wall Street as world stocks slid for a fifth straight day. (BBC/Jabulani Radio, 20 Nov 2026; One Turn)
5. **GULF — Missile hits Riyadh's tallest tower.** Houthi missiles damaged Riyadh's tallest tower; two tankers hit mines and burned near the Strait of Hormuz. (Reuters, 20 Nov 2026)
6. **WEATHER — Cyclone Akvan: India moves 47,000.** Odisha evacuated 47,000 people as Cyclone Akvan closed on the east coast. (Reuters, 19 Nov 2026)

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` — a 1024x1024 PNG, about 21 KB. Run it twice into two different directories and the files are byte-identical (`sha256sum` matches).
