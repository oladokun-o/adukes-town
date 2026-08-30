<script lang="ts">
  import { onMount } from "svelte";
  import BirthdayCard from "@/city/splash/BirthdayCard.svelte";
  import NxtedgeStudio from "@/city/splash/NxtedgeStudio.svelte";
  import {
    playBirthdayFlourish,
    playStudioChime,
    resumeAudioContext,
  } from "@/game/audio/juiceSounds";

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
  let studioSounded = false;

  // Mobile blocks audio until a user gesture, so the studio sting waits for
  // a tap to play its chime — with a long fallback so nobody gets stuck.
  const STUDIO_FALLBACK_MS = 8000;
  const BIRTHDAY_MS = 6500;

  let timer: ReturnType<typeof setTimeout> | undefined;

  function arm(ms: number): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(advance, ms);
  }

  function next(): void {
    if (finished) return;
    if (beat === "studio" && showBirthday) {
      beat = "birthday";
      playBirthdayFlourish();
      arm(BIRTHDAY_MS);
      return;
    }
    finished = true;
    if (timer) clearTimeout(timer);
    onDone();
  }

  // A tap during the studio beat: unlock audio, sound the chime, then move
  // on after a moment so the sting is actually heard.
  function advance(): void {
    if (finished) return;
    if (beat === "studio" && !studioSounded) {
      studioSounded = true;
      resumeAudioContext();
      playStudioChime();
      arm(950);
      return;
    }
    next();
  }

  onMount(() => {
    arm(STUDIO_FALLBACK_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

<div
  class="splash"
  role="button"
  tabindex="0"
  onpointerdown={resumeAudioContext}
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
