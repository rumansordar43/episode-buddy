# Episode Buddy — starter PWA

A mobile-friendly starter app to track anime and web series. The first version includes:
- Add series, type, season, last episode watched, optional total episode count, and a watch link.
- Update episode progress, mark a show as waiting for a new episode, and mark it completed.
- Filter the library and see Watching / Pending / Completed counts.
- Local browser storage and a basic notification permission flow.
- Responsive dark UI.

## Important limitation in this first version
The automatic MovieBox release checker is **not connected yet**. The supplied Moviebox-API repository must be tested for a working endpoint and current episode metadata. Reliable notifications when the app is closed also require a hosted backend/scheduler and push delivery setup. The “Run demo check” button is a demo and does not contact MovieBox.

## Test locally
Service workers and notifications usually require HTTPS or `localhost`.
1. Unzip this folder.
2. Open a terminal in this folder.
3. Run a local static server, for example `python -m http.server 8080`.
4. Visit `http://localhost:8080` in a browser.
5. For Android installation and push notifications, deploy the files to an HTTPS host (for example GitHub Pages or Vercel). Push notifications while the app is closed are not fully implemented by this starter.

## Deploy
You can import the folder into a GitHub repository and deploy it using a static hosting provider. No API key is needed for the local tracker itself.

## Next integration step
Before implementing automatic checks, confirm:
1. Which Moviebox-API endpoint returns show details and episode lists.
2. Whether that endpoint works without a login and is stable enough to poll.
3. A scheduled backend job and Web Push subscription storage (for example Supabase + a scheduled Edge Function).
4. A notification provider/push setup, including VAPID keys.

## Data and privacy
Watchlist data stays in this browser's local storage and is not synced between devices. Clearing browser site data may delete it. Export/backup and cloud sync can be added in a later update.
