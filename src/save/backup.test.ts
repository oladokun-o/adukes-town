import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { createDefaultCityState } from "@/game/city/types";
import { levels } from "@/game/levels";
import { getStoredProgress, storeProgress } from "@/game/levels/progress";
import { exportSave, exportSaveJson, importSave, importSaveJson } from "@/save/backup";
import { isRelaxModeEnabled, setRelaxModeEnabled } from "@/settings/relaxMode";

const firstLevelId = levels[0].id;

describe("exportSave", () => {
  it("bundles progress, relax mode, and city state", async () => {
    await storeProgress(firstLevelId, { Red: 4 });
    await setRelaxModeEnabled(true);
    await storeCityState({ ...createDefaultCityState(), coins: 42 });

    const bundle = exportSave();

    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.progress[firstLevelId]).toEqual({ Red: 4 });
    expect(bundle.relaxMode).toBe(true);
    expect(bundle.city.coins).toBe(42);
  });

  it("omits levels with no stored progress", async () => {
    await storeProgress(firstLevelId, {});
    const bundle = exportSave();
    expect(bundle.progress[firstLevelId]).toBeUndefined();
  });
});

describe("importSave", () => {
  it("restores progress, relax mode, and city state", async () => {
    const bundle = {
      schemaVersion: 1,
      progress: { [firstLevelId]: { Blue: 9 } },
      relaxMode: false,
      city: { ...createDefaultCityState(), coins: 77 },
    };

    await importSave(bundle);

    expect(getStoredProgress(firstLevelId)).toEqual({ Blue: 9 });
    expect(isRelaxModeEnabled()).toBe(false);
    expect(getCityState().coins).toBe(77);
  });

  it("rejects a mismatched schema version", async () => {
    const bundle = {
      schemaVersion: 999,
      progress: {},
      relaxMode: false,
      city: createDefaultCityState(),
    };

    await expect(importSave(bundle)).rejects.toThrow(/version/i);
  });
});

describe("exportSaveJson / importSaveJson", () => {
  it("round-trips through a JSON string", async () => {
    await storeProgress(firstLevelId, { Green: 3 });
    await storeCityState({ ...createDefaultCityState(), coins: 15 });

    const json = exportSaveJson();

    await storeCityState(createDefaultCityState());
    expect(getCityState().coins).toBe(0);

    await importSaveJson(json);
    expect(getCityState().coins).toBe(15);
  });

  it("rejects invalid JSON with a clear error", async () => {
    await expect(importSaveJson("not json")).rejects.toThrow(/valid save file/i);
  });

  it("rejects well-formed JSON that isn't a save bundle", async () => {
    await expect(importSaveJson(JSON.stringify({ hello: "world" }))).rejects.toThrow(
      /valid Aduke's Town save file/i,
    );
  });
});
