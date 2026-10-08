# hackflow

A hackathon registration form presented as a dive. Each question sits one layer deeper in the ocean, and continuing sinks you through the sunlight, twilight, midnight, abyssal and hadal zones to the floor of the Challenger Deep, where the confirmation screen waits.

- **Rendered water column.** A single WebGL fragment shader draws light absorption with depth, surface glare and light shafts, parallax marine snow that streaks while you descend, bioluminescence that flares when disturbed, and a lamp-lit trench floor.
- **Real readings.** Depth, pressure, water temperature and remaining sunlight come from simple oceanographic models (`src/ocean/physics.ts`) and update every frame of the dive.
- **Keyboard-first.** Enter continues, Shift+Enter adds a line break, A–Z picks an option, and arrow keys move within a choice group.
- **Accessible and resilient.** Proper labelling, focus management and radio-group semantics. Reduced-motion users get instant transitions and a still background. Without WebGL there is a CSS fallback, and context loss is handled.

## Getting started

Requires Node 20.19+ or 22.12+ (see `.nvmrc`).

```sh
npm install
npm run dev
```

| Script              | What it does                     |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the Vite dev server        |
| `npm run build`     | Type-check and build to `dist/`  |
| `npm run preview`   | Serve the production build       |
| `npm run typecheck` | Run the TypeScript compiler      |
| `npm run lint`      | Run ESLint                       |
| `npm test`          | Run unit tests with Vitest       |
| `npm run format`    | Format the project with Prettier |

## Configuration

Set `VITE_SUBMIT_URL` (for example in `.env.local`) to POST each registration as JSON to that endpoint. Without it, submissions are logged to the browser console only.

## Editing the form

Questions live in `src/form/questions.ts`. Supported types are `text`, `email`, `longtext` and `choice` (single select). Each question takes the next zone down. Past the fifth, further questions stay in the hadal zone and sink 1,000 m each.

## How it fits together

```
src/
  App.tsx              Composition: background, HUD, question panels
  form/                Questions, validation, reducer, fields, completion screen
  hud/                 Header, depth gauge, telemetry, field notes, step controls
  ocean/
    descent.ts         Eased camera timeline sampled by everything that moves
    renderer.ts        WebGL lifecycle: resize, adaptive resolution, context loss
    shaders.ts         The scene, in one fragment shader
    physics.ts         Pressure, temperature and light models
    zones.ts           Zone data and field notes
  ui/                  Button, Kbd, icons, logo
  styles/              Design tokens and global styles
```

The descent is a plain timeline object rather than React state. The shader, the depth gauge and the telemetry each sample it once per animation frame, writing straight to WebGL or the DOM, so a dive never re-renders React at 60 fps. The question panels stay mounted and stacked, and their CSS transitions take their timing from the length of the current dive.

## Notes on the data

The readings are illustrative, not survey-grade:

- **Pressure** assumes 1025 kg/m³ seawater.
- **Temperature** follows a representative profile for the tropical western Pacific.
- **Sunlight** assumes very clear water, with 1% of surface light remaining at 200 m.
- **Zones** are evenly spaced on the gauge, so it is not to scale.
