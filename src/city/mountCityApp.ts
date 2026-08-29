import { mount } from "svelte";
import CityApp from "@/city/CityApp.svelte";
import type { ResolvedBoosterModifiers } from "@/game/city/catalog";

export function mountCityApp(
  target: HTMLElement,
  props: { onPlayMatch3: (levelId: string, modifiers?: ResolvedBoosterModifiers) => void },
): void {
  mount(CityApp, { target, props });
}
