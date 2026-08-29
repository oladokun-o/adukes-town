import { mount, unmount } from "svelte";
import SplashSequence from "@/city/splash/SplashSequence.svelte";

// Mounts the intro sequence (studio sting → optional birthday card) and
// returns a teardown, same shape as mountOnboarding.ts — main.ts hands off
// to the normal boot once onDone fires.
export function mountSplash(
  target: HTMLElement,
  props: { showBirthday: boolean; onDone: () => void },
): () => void {
  const instance = mount(SplashSequence, { target, props });
  return () => {
    void unmount(instance);
  };
}
