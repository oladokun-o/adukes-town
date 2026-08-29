<script lang="ts">
  import { onMount } from "svelte";
  import BirthdayCard from "@/city/splash/BirthdayCard.svelte";
  import NxtedgeStudio from "@/city/splash/NxtedgeStudio.svelte";

  let {
    showBirthday,
    onDone,
  }: {
    showBirthday: boolean;
    onDone: () => void;
  } = $props();

  type Beat = "studio" | "birthday";
  let beat = $state<Beat>("studio");
  let finished = false;

  const STUDIO_MS = 2600;
  const BIRTHDAY_MS = 6500;

  let timer: ReturnType<typeof setTimeout> | undefined;

  function arm(ms: number): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(advance, ms);
  }

  function advance(): void {
    if (finished) return;
    if (beat === "studio" && showBirthday) {
      beat = "birthday";
      arm(BIRTHDAY_MS);
      return;
    }
    finished = true;
    if (timer) clearTimeout(timer);
    onDone();
  }

  onMount(() => {
    arm(STUDIO_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

<div
  class="splash"
  role="button"
  tabindex="0"
  onclick={advance}
  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && advance()}
>
  {#if beat === "studio"}
    <NxtedgeStudio />
  {:else if beat === "birthday"}
    <BirthdayCard />
  {/if}
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: #04045e;
    overflow: hidden;
  }
</style>
