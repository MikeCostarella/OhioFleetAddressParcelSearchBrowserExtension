// Ohio Parcel Finder - the toolbar popup, also opened as a full tab
// (popup.html?address=...) when a right-click or address-bar search needs the
// visitor to choose between several matches.

import { lookupWithFetch, MAX_LISTED } from "./vendor/address-lookup/addressLookup.js";

const form = /** @type {HTMLFormElement} */ (document.getElementById("form"));
const input = /** @type {HTMLInputElement} */ (document.getElementById("address"));
const go = /** @type {HTMLButtonElement} */ (document.getElementById("go"));
const status = /** @type {HTMLElement} */ (document.getElementById("status"));
const results = /** @type {HTMLUListElement} */ (document.getElementById("results"));

const fromUrl = new URLSearchParams(location.search).get("address");
// Opened as a tab (not the toolbar popup): lay out as a page, and never
// auto-open a single match - the visitor came here to see the choices.
const asPage = fromUrl !== null;
if (asPage) document.body.classList.add("page");

/** @param {string} text @param {""|"warn"|"err"} [kind] */
function say(text, kind = "") {
  status.textContent = text;
  status.className = kind;
}

/** @param {string} url */
function openApp(url) {
  chrome.tabs.create({ url });
  if (!asPage) window.close();
}

/** @param {string} address */
async function find(address) {
  address = address.replace(/\s+/g, " ").trim();
  results.replaceChildren();
  if (!address) return;
  chrome.storage.local.set({ lastAddress: address });
  go.disabled = true;
  say("Looking up the address…");
  const r = await lookupWithFetch(address);
  go.disabled = false;

  switch (r.status) {
    case "error":
      say("Couldn't reach the Census geocoder. Check your connection and try again.", "err");
      return;
    case "none":
      say("No match for that address. Include the house number and ZIP or city.", "warn");
      return;
    case "not-ohio": {
      const where = r.matches[0]?.address ?? "outside Ohio";
      say(`That address is outside Ohio (${where}). The parcels maps cover Ohio's 88 counties.`, "warn");
      return;
    }
    case "no-app":
      say(`Found it in ${r.matches[0]?.countyName || "Ohio"}, but there's no parcels map for that county yet.`, "warn");
      return;
  }

  if (r.links.length === 1 && !asPage) {
    openApp(r.links[0].url);
    return;
  }
  say(
    r.links.length === 1
      ? "Found it:"
      : r.links.length > MAX_LISTED
        ? `${r.links.length} matches - showing the first ${MAX_LISTED}. Add the city or ZIP to narrow it down.`
        : `${r.links.length} matches. Pick the right one:`,
  );
  for (const link of r.links.slice(0, MAX_LISTED)) {
    const li = document.createElement("li");
    const addr = document.createElement("div");
    addr.className = "addr";
    addr.textContent = link.match.address;
    const county = document.createElement("div");
    county.className = "county";
    county.textContent = `${link.county} County`;
    const open = document.createElement("a");
    open.className = "open";
    open.href = link.url;
    open.textContent = `Open in ${link.county} County Parcels`;
    open.addEventListener("click", (e) => {
      e.preventDefault();
      openApp(link.url);
    });
    li.append(addr, county, open);
    results.append(li);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  find(input.value);
});

if (fromUrl) {
  input.value = fromUrl;
  find(fromUrl);
} else {
  chrome.storage.local.get("lastAddress").then(({ lastAddress }) => {
    if (typeof lastAddress === "string" && !input.value) {
      input.value = lastAddress;
      input.select();
    }
  });
}
input.focus();
