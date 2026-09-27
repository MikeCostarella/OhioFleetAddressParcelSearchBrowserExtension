# OhioFleetAddressParcelSearchBrowserExtension

**Ohio Parcel Finder**: a Chrome / Edge extension that takes any Ohio street
address and opens it on the right county's parcels map, already searched and
zoomed to the parcel.

There are three ways to use it:

- **Toolbar popup:** click the icon, type an address, press Enter.
- **Right-click:** select an address on any web page, then choose
  *Find Ohio parcel for "..."*.
- **Address bar:** type `parcel`, a space, then the address, and press Enter.

One match opens that county's parcels app directly. Several matches (for example
"100 Main St, Columbus" is both W and E Main) open a results page to choose from.
No match, or an address outside Ohio, says so.

## How it works

1. The address goes to the U.S. Census Bureau geocoder, which returns the
   matched address, its point and its county (FIPS).
2. `vendor/address-lookup/parcelsApps.js` maps the county to its parcels app.
   The table is generated from the Statehouse fleet manifest.
3. The app opens with a deep link, `?q=<street>, <zip>&lat=..&lon=..`. Every
   parcels app reads it on load (parcels-core 1.11.0): it runs the search, and
   if the Auditor's address doesn't match, it flies to the geocoded point.

`vendor/address-lookup/` is **vendored** from
[FleetShareableCodeComponents](https://github.com/MikeCostarella/FleetShareableCodeComponents).
Don't edit it here. Change it there, then sync it from Statehouse:

```powershell
cd C:\projects\Statehouse
python scripts\sync-shared-code.py --lib address-lookup --apply
```

The extension itself is plain JavaScript, with no build step and no dependencies.

## Install for yourself (unpacked)

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick `C:\projects\OhioFleetAddressParcelSearchBrowserExtension`.
4. Pin the icon from the puzzle-piece menu.

After pulling changes, click the reload arrow on the extension's card.

## Permissions

| Permission | Why |
|---|---|
| `https://geocoding.geo.census.gov/*` | look up the address (the geocoder sends no CORS headers, so only an extension with this host permission can call it directly) |
| `contextMenus` | the right-click *Find Ohio parcel* item |
| `storage` | remember the last address typed in the popup |

The extension reads nothing from pages you visit. Only text you select and
then right-click is used. See [PRIVACY.md](PRIVACY.md).

## Publishing

Publishing to the Chrome Web Store / Edge Add-ons is a later, separate step. It
needs a developer account, store screenshots, and PRIVACY.md as the privacy
policy. Zip the folder **without** `.git` to upload.
