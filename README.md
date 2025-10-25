# RitamCast

RitamCast is a polished Angular 18 weather experience delivering real-time conditions, seven-day outlooks, and hour-by-hour trends through a glassmorphic dashboard. Weather data is sourced live from the free Open-Meteo APIs, so you can explore the atmosphere without juggling API keys.

## Highlights
- Instant city search with debounced suggestions and curated quick picks for one-tap forecasts.
- Rich current-conditions card featuring feels-like temperature, humidity, wind, UV index, sunrise, sunset, and rain probability.
- Seven-day outlook and next-twelve-hours panels tuned for both desktop and mobile layouts.
- Type-safe models plus a reusable weather service that shapes Open-Meteo responses into clean view models.
- Layered gradients and glass panels that give the app an immersive, modern aesthetic.

## Getting started
```
npm install      # install dependencies
npm start        # launch the dev server on http://localhost:4200
npm run build    # create a production build (dist/ritamcast)
npm test         # execute unit tests
```

No API keys are required because Open-Meteo exposes public endpoints. To swap in another provider, update `src/app/core/services/weather.service.ts` with the new base URL and mapping logic.

## Project layout
- `src/app/features/weather-dashboard` - standalone dashboard component, template, and styling.
- `src/app/core/services/weather.service.ts` - Open-Meteo client plus helper transformations.
- `src/app/core/models/weather.models.ts` - interfaces describing weather payloads used across the app.
- `src/styles.scss` - global gradient backdrop and typography system.

## Customising the experience
- Adjust the quick-pick cities in `weather-dashboard.component.ts` to suit your audience.
- Tune the visual language in `weather-dashboard.component.scss` or `app.component.scss`.
- Component style budgets were relaxed (`angular.json`) to support the richer glassmorphism theme.

## Credits
- Weather data by https://open-meteo.com/
- Built with https://angular.dev/