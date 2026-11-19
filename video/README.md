# lucid promo video

The ~58 s promo on [lucid.meertarbani.in](https://lucid.meertarbani.in), made with [Remotion](https://www.remotion.dev). Two formats from one composition: `Promo16x9` (1920×1080) and `Promo9x16` (1080×1920).

```bash
npm i
npm run dev                                         # Remotion Studio
npx remotion render Promo16x9 out/raw-16x9.mp4      # or Promo9x16
```

Then normalize to −14 LUFS for social: a two-pass `ffmpeg -af loudnorm=I=-14:TP=-1` with `-c:v copy`. The site copy is `site/public/video/lucid.mp4`, re-encoded with `-crf 26 -movflags +faststart`.

- `src/scenes.tsx`: the scenes. Every time is in absolute seconds (`T`), locked to the voiceover.
- `src/Promo.tsx`: the scene timeline, the audio mix and word-pop captions.
- `src/words.json`: every spoken word at its absolute time, from ElevenLabs Scribe.
- `src/ui.tsx`: the palette, fonts, eye mark, cards and glitch effects.

The voiceover is two ElevenLabs takes spliced together (see `VO` in `Promo.tsx`). If you regenerate it, transcribe it again and update `T` and `words.json`.

Every number on screen comes from the README's benchmark tables.

## Audio license

The repo's MIT license does **not** cover `public/audio/`:
- The voice, music and most sound effects were generated with [ElevenLabs](https://elevenlabs.io) on its free plan, which requires attribution.
- `scratch.wav`, `vineboom.wav` and `whoosh.wav` come from [remotion.media](https://remotion.media).
