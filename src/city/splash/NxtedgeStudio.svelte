<script lang="ts">
  import { onMount } from "svelte";
  import { playStudioChime, resumeAudioContext } from "@/game/audio/juiceSounds";

  onMount(() => {
    // Best-effort: if the audio context isn't unlocked on this fresh load
    // the chime is silent and BirthdayCard retries after the first tap.
    resumeAudioContext();
    playStudioChime();
  });
</script>

<div class="studio">
  <img class="lockup" src="/brand/nxtedge-lockup-white.png" alt="NxtEdge Studio" />
  <p class="tag">presents</p>
</div>

<style>
  .studio {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    /* NxtEdge electric blue — the letterbox behind the lockup. */
    background: #04045e;
  }

  .lockup {
    width: min(46vh, 62vw);
    max-width: 420px;
    height: auto;
    filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.45));
    animation: mark-in 900ms cubic-bezier(0.2, 0.9, 0.3, 1) both;
  }

  .tag {
    margin: 0;
    font-family: "Electrolize", var(--font-display);
    font-size: 0.8rem;
    letter-spacing: 0.35em;
    text-transform: lowercase;
    color: rgba(255, 249, 249, 0.55);
    animation: tag-in 500ms 700ms ease both;
  }

  @keyframes mark-in {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes tag-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lockup,
    .tag {
      animation: none;
    }
  }
</style>
