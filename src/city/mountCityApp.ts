import { mount } from "svelte";
import CityApp from "@/city/CityApp.svelte";

export function mountCityApp(
  target: HTMLElement,
  props: { onPlayMatch3: (levelId: string) => void },
): void {
  mount(CityApp, { target, props });
}
