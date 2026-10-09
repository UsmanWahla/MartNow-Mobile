# MartNow Mobile

Customer-only React Native application built with Expo, TypeScript, and Expo Router. It connects to the existing MartNow backend; this repository intentionally contains no backend code, database logic, or server-side secrets.

## Configure the mobile API URL

1. Copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Find the **IPv4 Address** for the Wi-Fi adapter on the computer that runs the existing backend:

   ```powershell
   ipconfig
   ```

3. Set the mobile environment variable using that address and the verified backend port (`5000`):

   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000
   ```

   Do not use `localhost` or `127.0.0.1`; on Expo Go those point to the Android phone itself. The `.env` file is ignored by Git and must never contain backend secrets.

## Start the existing backend

In the **separately extracted/existing** MartNow web project's `backend` folder, keep its existing `.env` configuration and run:

```powershell
npm install
npm run dev
```

The backend's `server.js` listens on `PORT` or port `5000` by default. Do not run database setup or migration commands just to start this mobile project. If PowerShell blocks `npm.ps1`, use `npm.cmd` instead.

## Start Expo Go development

From this `MartNow-Mobile` folder:

```powershell
npx expo start
```

If PowerShell blocks `npx.ps1`, use `npx.cmd expo start`. Install **Expo Go** on Android, make sure the phone and computer use the same Wi-Fi, then scan the QR code in Expo Go.

The app opens on the live MartNow marketplace. Stores, products, cart, checkout, addresses, orders, and account data all come from the existing backend; no mock catalogue or fake orders are included.

## Customer app structure

- `src/app/` contains thin Expo Router route files only.
- `src/pages/market/` contains marketplace home, store search, login, and registration.
- `src/pages/shop/` contains store, product, cart, and checkout screens.
- `src/pages/customer/` contains account, security, addresses, orders, and order detail.
- `src/components/{shared,market,shop,customer}/` contains reusable mobile UI.
- `src/services/`, `src/store/`, `src/types/`, and `src/utils/` contain API, session, state, contracts, and domain helpers.

## Validate before release

```powershell
npx tsc --noEmit
npx expo lint
npm test
npm run format:check
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

The development API currently uses plain HTTP on the trusted local Wi-Fi network. Set `MARTNOW_ALLOW_HTTP=true` only for a local development build. Production builds must use an HTTPS API URL and leave that flag unset.

Before the first EAS build, set the final `android.package` and `ios.bundleIdentifier` in `app.json`, then run `npx eas-cli build:configure`. The included `eas.json` keeps preview and production environments separate. Production configuration fails early if the API URL is not HTTPS or development cleartext HTTP is enabled.

## Maps

The customer address picker draws the same OpenStreetMap raster tiles as the web frontend. Tiles are downloaded with an application User-Agent, because OpenStreetMap replaces the default Android image-loader agent with a block image. It works in Expo Go and in the current development build. No Google Maps API key or billing account is required.

`expo-maps` is not used. That package is absent from Expo Go, and on Android it renders Google Maps, which stays blank in a custom build until a Google Maps API key is added and a new native build is installed.

OpenStreetMap attribution is visible in the map. The public OSM tile service is suitable for normal interactive use only; do not add offline downloads or tile prefetching. Before a high-traffic production release, use an OSM-compatible managed tile provider or self-hosted tiles.

## If the phone cannot connect

- First open `http://YOUR_COMPUTER_LAN_IP:5000/` in the phone browser. It should return `Node.js backend is running`.
- Verify the computer and phone are on the same non-guest Wi-Fi. Turn off VPNs that isolate local-network traffic.
- Ensure the backend is running and its configured port matches `.env`.
- Allow Node.js/the backend port through Windows Defender Firewall for private networks. Do not expose the development backend publicly.
- Restart Expo after changing `.env` so the `EXPO_PUBLIC_*` value is reloaded.
- CORS is mainly a browser concern. Expo Go is a native client; if the browser test above fails, solve Wi-Fi/firewall/LAN reachability first.
- `npx expo start --tunnel` can help Expo Go load the JavaScript bundle, but it does **not** tunnel the backend API. The API URL still needs to be reachable from the phone.

## Architecture

`src/app/` contains Expo Router routes, `src/components/` reusable UI, `src/services/` the API and secure token helpers, `src/hooks/` responsive helpers, `src/types/` API contracts, `src/constants/` environment configuration, and `src/utils/` domain utilities. See [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) for the inspected API contract and [docs/WEB_TO_MOBILE_MAP.md](docs/WEB_TO_MOBILE_MAP.md) for the customer-screen mapping.
