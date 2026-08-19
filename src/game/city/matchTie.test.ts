import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { BASE_LEVEL_WIN_COINS, LOSS_CONSOLATION_COINS } from "@/game/city/rewards";
import { createDefaultCityState } from "@/game/city/types";

// @/game/events pulls in real Phaser (for its EventEmitter), which assumes
// browser globals this suite's Node test environment doesn't provide.
// matchTie.ts only needs the bus's shape (GameEvents/onGameEvent/
// emitGameEvent), so a tiny in-memory fake stands in for it here.
vi.mock("@/game/events", () => {
  const listeners = new Map<string, Array<(payload: unknown) => void>>();
  const GameEvents = { LevelWin: "level:win", LevelLose: "level:lose" } as const;
  return {
    GameEvents,
    onGameEvent: (event: string, handler: (payload: unknown) => void) => {
      const handlers = listeners.get(event) ?? [];
      handlers.push(handler);
      listeners.set(event, handlers);
    },
    emitGameEvent: (event: string, payload: unknown) => {
      for (const handler of listeners.get(event) ?? []) handler(payload);
    },
  };
});

const { emitGameEvent, GameEvents } = await import("@/game/events");
const { initMatchCoinTie } = await import("@/game/city/matchTie");

// initMatchCoinTie subscribes once for the whole process; call it once here
// and drive every scenario through the shared bus + shared cache, resetting
// the city state at the start of each test.
initMatchCoinTie();

describe("initMatchCoinTie", () => {
  it("deposits the win reward and records the level id on LevelWin", async () => {
    await storeCityState(createDefaultCityState());

    // The handler mutates the in-memory cache synchronously (before its own
    // fire-and-forget idb write); no need to wait for that write to settle.
    emitGameEvent(GameEvents.LevelWin, { levelId: "level003", movesRemaining: 0 });
    expect(getCityState().coins).toBe(BASE_LEVEL_WIN_COINS);
    expect(getCityState().lastPlayedLevelId).toBe("level003");
  });

  it("deposits the consolation reward and records the level id on LevelLose", async () => {
    await storeCityState(createDefaultCityState());

    emitGameEvent(GameEvents.LevelLose, {
      levelId: "level004",
      progress: {},
      targets: {},
    });
    expect(getCityState().coins).toBe(LOSS_CONSOLATION_COINS);
    expect(getCityState().lastPlayedLevelId).toBe("level004");
  });
});
