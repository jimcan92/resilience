# sv

## AI recommendations

Set `GEMINI_API_KEY` in the server environment to enable Gemini recommendations.
Without a key, or when generation fails, the app uses local rule-based recommendations.
The endpoint validates inputs and recalculates scores; browser-supplied scores are ignored.
Gemini receives building/site context and model parameters, but not exact coordinates.

AI requests have a 20-second server deadline and a 25-second browser deadline.
Successful AI recommendations are cached in the browser for seven days, with up to
50 entries keyed by exact prompt context and model/prompt version. Rule-based results
are not cached. Bump `RECOMMENDATION_VERSION` when changing the prompt or AI model.

The endpoint includes a best-effort limit of 10 requests per minute per client address,
per running server instance. **Before public deployment, configure a shared rate limiter
or a Vercel Firewall rate-limit rule for POST `/api/recommendations`.** In-memory limits
reset on cold starts and do not coordinate across serverless instances. Browser caching
does not provide API abuse protection. Configure provider quotas/budget controls as well.

Run `pnpm test` for engine and mocked recommendation regressions, and `pnpm check`
for Svelte/TypeScript validation. Tests do not make billable Gemini calls.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.17.0 create --template minimal --types ts --add prettier tailwindcss="plugins:none" sveltekit-adapter="adapter:vercel" --install pnpm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
