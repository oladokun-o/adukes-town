<script lang="ts">
  import { remember, storyState, visit } from "@/city/visitStore";
  import { getAllFacts, getLineForVisit } from "@/game/story/dapo";
  import { REMEMBER_REWARD_COINS, type CharacterId } from "@/game/story/types";

  let { onClose }: { onClose: () => void } = $props();

  const characterId: CharacterId = "dapo";
  const displayName = "Dapo";

  let character = $derived($storyState.characters[characterId]);
  let currentLine = $derived(getLineForVisit(characterId, character.visits));
  let allFacts = $derived(getAllFacts(characterId));
  let rememberableFacts = $derived(
    allFacts.filter(
      (fact) =>
        character.discoveredFactIds.includes(fact.id) &&
        !character.actedOnFactIds.includes(fact.id),
    ),
  );

  function talk(): void {
    visit(characterId);
  }

  function rememberThis(factId: string): void {
    remember(characterId, factId);
  }
</script>

<div class="visit">
  <button type="button" class="back-btn" onclick={onClose}>&larr; Back to Town</button>

  <h2>{displayName}</h2>

  <p class="dialogue">
    {currentLine ? currentLine.line : `You haven't talked to ${displayName} yet.`}
  </p>

  <button type="button" class="talk-btn" onclick={talk}>Talk</button>

  {#if rememberableFacts.length > 0}
    <section class="remember">
      <h3>Remember something</h3>
      {#each rememberableFacts as fact (fact.id)}
        <button type="button" class="remember-btn" onclick={() => rememberThis(fact.id)}>
          {fact.text}
          <span class="reward">+{REMEMBER_REWARD_COINS} coins</span>
        </button>
      {/each}
    </section>
  {/if}
</div>

<style>
  .visit {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    /* pointer-events is inherited — #city-app (this component's mount
       ancestor, see styles.css) is pointer-events: none by default, so
       this needs to explicitly opt back in or Talk/Remember/Back would be
       unclickable. */
    pointer-events: auto;
  }

  .visit {
    color: var(--ink);
  }

  .back-btn {
    align-self: flex-start;
    border: none;
    background: transparent;
    color: rgba(58, 43, 34, 0.75);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.25rem 0;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.4rem;
  }

  .dialogue {
    background: var(--panel);
    border: none;
    border-radius: 0.9rem;
    padding: 1rem;
    line-height: 1.5;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);
  }

  .talk-btn {
    align-self: flex-start;
    border: none;
    border-radius: 999px;
    padding: 0.6rem 1.2rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .talk-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .remember h3 {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-size: 1rem;
  }

  .remember-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    text-align: left;
    border: 2px dashed rgba(58, 43, 34, 0.3);
    border-radius: 0.9rem;
    background: rgba(255, 246, 233, 0.6);
    color: var(--ink);
    padding: 0.75rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  .reward {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: #b57a12;
    font-weight: 700;
  }
</style>
