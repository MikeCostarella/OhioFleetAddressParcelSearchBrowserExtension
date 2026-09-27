// Ohio Parcel Finder - service worker.
//
// Two ways in besides the toolbar popup:
//   - right-click selected text -> "Find Ohio parcel for ..."
//   - address bar: type `parcel`, a space, then an address
// Both geocode the address (vendor/address-lookup). One match opens that
// county's parcels app straight on the parcel; anything else (several matches,
// no match, out of state) opens the results page so the visitor can choose.

import { lookupWithFetch } from "./vendor/address-lookup/addressLookup.js";

const MENU_ID = "find-ohio-parcel";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Find Ohio parcel for "%s"',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;
  findParcel(info.selectionText, "newForegroundTab", tab);
});

chrome.omnibox.setDefaultSuggestion({ description: "Find the Ohio parcel for: %s" });
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  findParcel(text, disposition);
});

/**
 * @param {string} text  an address, possibly spread over several selected lines
 * @param {chrome.omnibox.OnInputEnteredDisposition} disposition
 * @param {chrome.tabs.Tab} [fromTab]
 */
async function findParcel(text, disposition, fromTab) {
  const address = text.replace(/\s+/g, " ").trim();
  if (!address) return;
  chrome.storage.local.set({ lastAddress: address });
  const r = await lookupWithFetch(address);
  const url =
    r.status === "found" && r.links.length === 1
      ? r.links[0].url
      : chrome.runtime.getURL("popup.html?address=" + encodeURIComponent(address));
  if (disposition === "currentTab") {
    chrome.tabs.update({ url });
  } else {
    chrome.tabs.create({
      url,
      active: disposition !== "newBackgroundTab",
      ...(fromTab ? { index: fromTab.index + 1, openerTabId: fromTab.id } : {}),
    });
  }
}
