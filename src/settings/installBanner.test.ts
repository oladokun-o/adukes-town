import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  dismissInstallBanner,
  isInstallBannerDismissed,
  loadInstallBannerDismissedFromDb,
} from "@/settings/installBanner";
import { idbGet, idbSet } from "@/save/db";

describe("isInstallBannerDismissed / dismissInstallBanner", () => {
  it("persists the dismissal to IndexedDB and updates the in-memory cache immediately", async () => {
    await dismissInstallBanner();
    expect(isInstallBannerDismissed()).toBe(true);
    expect(await idbGet("settings:install-banner-dismissed")).toBe(true);
  });
});

describe("loadInstallBannerDismissedFromDb", () => {
  it("hydrates the cache from whatever is persisted in IndexedDB", async () => {
    // written directly, bypassing dismissInstallBanner — simulates a value
    // saved in a prior session, before the in-memory cache is hydrated.
    await idbSet("settings:install-banner-dismissed", true);

    await loadInstallBannerDismissedFromDb();
    expect(isInstallBannerDismissed()).toBe(true);
  });
});
