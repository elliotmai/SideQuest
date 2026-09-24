# Side Quest

Turn any outing into a drinking/points game — Last Leg-style prop bets for travel, beach days,
football, general hangouts, and expansion packs like Bad Person.

## Stack

- React (Vite) — deployed as a static site on Netlify
- Firebase Auth (anonymous by default, optional Google sign-in to persist friends across devices)
- Firestore — realtime scoreboard sync, with built-in offline persistence so taps made without
  a connection (e.g. mid-flight) queue locally and sync once signal returns
- Packs and modes are static data bundled into the app (`src/data/`), not fetched over the
  network, so every device always has the identical, full event list even fully offline.

## Local setup

1. Create a Firebase project (free Spark plan is enough). Enable **Firestore** and
   **Authentication → Anonymous** + **Google**.
2. Copy `.env.example` to `.env` and fill in your Firebase web app config values.
3. `npm install`
4. `npm run dev`
5. Deploy Firestore security rules: `firebase deploy --only firestore:rules` (requires the
   Firebase CLI and `firebase init` pointed at this project — see `firestore.rules`).

## Deploying

Push to Netlify (connected to this repo) — `netlify.toml` sets the build command, publish
directory, and the SPA redirect react-router needs. Set the same `VITE_FIREBASE_*` env vars in
the Netlify site's build settings.

## Concepts

- **Packs** (`src/data/packs.js`): sets of scorable events (Travel, Beach Day, General Outing,
  Football/Last Leg, Bad Person expansion).
- **Modes** (`src/data/modes.js`): global transforms applied on top of any pack — Standard,
  No Shots, Clean (points only, no alcohol), Chaos (double points).
- **Sessions** (`src/lib/session.js`): a live game, identified by a 6-character shareable code.
  Anyone with the link/code can join with a username; scores update in realtime for everyone.
- **Friends & groups** (`src/lib/friends.js`): add friends by username, save persistent groups
  for people you play with often, and quick-start a new session from a saved group.
