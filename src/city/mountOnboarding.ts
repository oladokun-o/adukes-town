import { mount, unmount } from "svelte";
import Onboarding from "@/city/Onboarding.svelte";

// Returns a cleanup function so callers (main.ts) don't need to know
// Svelte's own mount/unmount API — same abstraction mountCityApp.ts gives
// for mounting, extended here since onboarding is meant to be torn down
// once it hands off to the city.
export function mountOnboarding(
  target: HTMLElement,
  props: { onComplete: () => void },
): () => void {
  const instance = mount(Onboarding, { target, props });
  return () => unmount(instance);
}
