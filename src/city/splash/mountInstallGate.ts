import { mount, unmount } from "svelte";
import InstallGate from "@/city/splash/InstallGate.svelte";

// Mounts the "add to Home Screen" gate and returns a teardown, same shape as
// mountSplash.ts — main.ts hands off to boot() once onDone fires (either the
// app was installed, or she chose to continue in the browser).
export function mountInstallGate(target: HTMLElement, props: { onDone: () => void }): () => void {
  const instance = mount(InstallGate, { target, props });
  return () => {
    void unmount(instance);
  };
}
