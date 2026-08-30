<script lang="ts">
  import { onMount } from "svelte";
  import BackupPanel from "@/city/BackupPanel.svelte";
  import BarnMeter from "@/city/BarnMeter.svelte";
  import {
    armBoostersAction,
    barn,
    buildStructureAction,
    buyPlotAction,
    buySeedAction,
    cityState,
    collectFactoryAction,
    collectPenAction,
    collectPlaneAction,
    collectShipAction,
    collectTrainAction,
    buildHabitatAction,
    buyPicksAction,
    claimAchievementAction,
    claimDailyAction,
    deep,
    digMineAction,
    expandTownAction,
    feedPenAction,
    fulfill,
    harvest,
    loadPlaneAction,
    loadShipAction,
    loadWagonAction,
    plant,
    popBalloonAction,
    queueRecipeAction,
    rerollOrderAction,
    rushFactoryAction,
    rushPenAction,
    sellItemAction,
    town,
    story,
    talkToAction,
    rememberFactAction,
    celebrateFestivalAction,
    repairSetbackAction,
    upgradeBarnAction,
    xpMeter,
  } from "@/city/cityStore";
  import AchievementsPanel from "@/city/AchievementsPanel.svelte";
  import AnimalPen from "@/city/AnimalPen.svelte";
  import BarnPanel from "@/city/BarnPanel.svelte";
  import BuildPanel from "@/city/BuildPanel.svelte";
  import CoinBadge from "@/city/CoinBadge.svelte";
  import CropPlot from "@/city/CropPlot.svelte";
  import Factory from "@/city/Factory.svelte";
  import HarborPanel from "@/city/HarborPanel.svelte";
  import InstallBanner from "@/city/InstallBanner.svelte";
  import LevelBadge from "@/city/LevelBadge.svelte";
  import MarketScreen from "@/city/MarketScreen.svelte";
  import MinePanel from "@/city/MinePanel.svelte";
  import OrderPanel from "@/city/OrderPanel.svelte";
  import Plane from "@/city/Plane.svelte";
  import Train from "@/city/Train.svelte";
  import ZooPanel from "@/city/ZooPanel.svelte";
  import Match3Entry from "@/city/Match3Entry.svelte";
  import SquarePanel from "@/city/SquarePanel.svelte";
  import Toasts from "@/city/Toasts.svelte";
  import { barnUsed } from "@/game/city/barn";
  import {
    PLOT_COSTS,
    PLOT_UNLOCK_LEVEL,
    resolveBoosterModifiers,
    type ResolvedBoosterModifiers,
  } from "@/game/city/catalog";
  import { GameEvents, offGameEvent, onGameEvent, type TownTileTappedPayload } from "@/game/events";
  import { getNextLevel, levels } from "@/game/levels";
  import { isRelaxModeEnabled, setRelaxModeEnabled } from "@/settings/relaxMode";

  let {
    onPlayMatch3,
  }: {
    onPlayMatch3: (levelId: string, modifiers?: ResolvedBoosterModifiers) => void;
  } = $props();

  let match3Entry: { levelId: string; levelName: string } | null = $state(null);
  let relax = $state(isRelaxModeEnabled());

  function toggleRelax(on: boolean): void {
    relax = on;
    setRelaxModeEnabled(on).catch((err: unknown) => {
      console.warn("Aduke's Town: couldn't save relax-mode setting.", err);
    });
  }

  function startMatch3(boosterIds: string[]): void {
    if (!match3Entry) return;
    const { levelId } = match3Entry;
    if (boosterIds.length > 0) armBoostersAction(boosterIds);
    match3Entry = null;
    onPlayMatch3(levelId, resolveBoosterModifiers(boosterIds));
  }

  // The town is drawn by TownScene on the canvas underneath. Tapping a
  // tile emits TownTileTapped; this opens the matching detail panel.
  let activeTile: TownTileTappedPayload | null = $state(null);

  onMount(() => {
    const handleTap = (payload: TownTileTappedPayload) => {
      // Tapping a ready crop harvests it on the spot — no panel, the
      // Township feel the game is going for.
      if (payload.kind === "plot") {
        const plot = $cityState.plots.find((p) => p.id === payload.id);
        if (plot?.planting && Date.now() >= plot.planting.timer.readyAt) {
          harvest(plot.id);
          return;
        }
      }
      activeTile = payload;
    };
    onGameEvent(GameEvents.TownTileTapped, handleTap);
    return () => offGameEvent(GameEvents.TownTileTapped, handleTap);
  });

  function closePanel(): void {
    activeTile = null;
  }

  function playMatch3(): void {
    const last = $cityState.lastPlayedLevelId;
    const nextLevel = (last ? getNextLevel(last) : null) ?? levels[0];
    relax = isRelaxModeEnabled();
    match3Entry = { levelId: nextLevel.id, levelName: nextLevel.name };
  }

  let activePlot = $derived(
    activeTile?.kind === "plot"
      ? ($cityState.plots.find((p) => p.id === activeTile.id) ?? null)
      : null,
  );
  let activeFactoryId = $derived(activeTile?.kind === "factory" ? activeTile.id : null);
  let barnFree = $derived(Math.max(0, $barn.capacity - $barn.used));
</script>

<div class="hud">
  <header>
    <h1>Aduke's Town</h1>
    <div class="badges">
      <LevelBadge level={$xpMeter.level} current={$xpMeter.current} needed={$xpMeter.needed} />
      <CoinBadge coins={$cityState.coins} />
      <span class="pill" title="Match-3 lives — regenerate over time, never buyable"
        >♥ {$deep.lives}/{$deep.maxLives}</span
      >
      <span class="pill" title="Tokens — earned only, spent on rushing timers"
        >💠 {$deep.tokens}</span
      >
      <span class="pill" title="Booster charges — earned from match-3 wins"
        >⚡ {$deep.boosterCharges}</span
      >
      <button
        type="button"
        class="badge-btn"
        onclick={() => (activeTile = { kind: "barn", id: "barn" })}
      >
        <BarnMeter used={$barn.used} capacity={$barn.capacity} />
      </button>
    </div>
  </header>

  <InstallBanner />

  <div class="actions-row">
    <button type="button" class="play-btn" onclick={playMatch3}>Play Match-3</button>
    <button
      type="button"
      class="build-btn"
      onclick={() => (activeTile = { kind: "build", id: "build" })}
    >
      🏗️ Build · 👥 {$town.population} · ⭐ {$town.reputation}
    </button>
  </div>

  <div class="actions-row">
    {#if $deep.dailyAvailable}
      <button type="button" class="chip daily" onclick={claimDailyAction}>
        🎁 Daily bonus{$deep.dailyStreak > 0 ? ` (day ${$deep.dailyStreak + 1})` : ""}
      </button>
    {/if}
    {#if $deep.balloonReady}
      <button type="button" class="chip balloon" onclick={popBalloonAction}>🎈 Gift!</button>
    {/if}
    {#if $deep.claimable > 0}
      <button
        type="button"
        class="chip award"
        onclick={() => (activeTile = { kind: "achievements", id: "achievements" })}
      >
        🏆 {$deep.claimable} to claim
      </button>
    {/if}
    {#if $story.pendingRemembers > 0}
      <button
        type="button"
        class="chip remember"
        onclick={() => (activeTile = { kind: "npc", id: "square" })}
      >
        💭 {$story.pendingRemembers} to remember
      </button>
    {/if}
    {#if $story.activeSetback}
      <button type="button" class="chip setback" onclick={repairSetbackAction}>
        🌧️ {$story.activeSetback.label} — repair
      </button>
    {/if}
  </div>

  <details class="backup-disclosure">
    <summary><img src="/icons/gear.png" alt="" /> Backup</summary>
    <BackupPanel />
  </details>
</div>

{#if match3Entry}
  <div class="overlay" role="presentation" onclick={() => (match3Entry = null)}>
    <div class="overlay-panel" role="presentation" onclick={(e) => e.stopPropagation()}>
      <Match3Entry
        levelName={match3Entry.levelName}
        lives={$deep.lives}
        maxLives={$deep.maxLives}
        msToNextLife={$deep.msToNextLife}
        boosterCharges={$deep.boosterCharges}
        {relax}
        onToggleRelax={toggleRelax}
        onStart={startMatch3}
      />
      <button type="button" class="close-btn" onclick={() => (match3Entry = null)}>Close</button>
    </div>
  </div>
{/if}

{#if activeTile}
  <div class="overlay" role="presentation" onclick={closePanel}>
    <div class="overlay-panel" role="presentation" onclick={(e) => e.stopPropagation()}>
      {#if activePlot}
        {@const plot = activePlot}
        <CropPlot
          {plot}
          level={$cityState.level}
          inventory={$cityState.inventory}
          cost={PLOT_COSTS[plot.id]}
          unlockLevel={PLOT_UNLOCK_LEVEL[plot.id] ?? 1}
          canAfford={$cityState.coins >= (PLOT_COSTS[plot.id] ?? Infinity)}
          onPlant={(cropId) => {
            plant(plot.id, cropId);
            closePanel();
          }}
          onHarvest={() => {
            harvest(plot.id);
            closePanel();
          }}
          onBuyPlot={() => {
            buyPlotAction(plot.id);
            closePanel();
          }}
        />
      {:else if activeFactoryId}
        {@const fid = activeFactoryId}
        <Factory
          factoryId={fid}
          runtime={$cityState.factories[fid]}
          level={$cityState.level}
          inventory={$cityState.inventory}
          tokens={$deep.tokens}
          onQueue={(recipeId) => queueRecipeAction(fid, recipeId)}
          onCollect={() => collectFactoryAction(fid)}
          onRush={() => rushFactoryAction(fid)}
        />
      {:else if activeTile.kind === "animal"}
        {@const pid = activeTile.id}
        <AnimalPen
          penId={pid}
          runtime={$cityState.animals[pid]}
          inventory={$cityState.inventory}
          tokens={$deep.tokens}
          onFeed={() => feedPenAction(pid)}
          onCollect={() => collectPenAction(pid)}
          onRush={() => rushPenAction(pid)}
        />
      {:else if activeTile.kind === "order"}
        <OrderPanel
          orders={$cityState.orders}
          inventory={$cityState.inventory}
          onFulfill={fulfill}
          onReroll={rerollOrderAction}
        />
      {:else if activeTile.kind === "train"}
        <Train
          train={$cityState.train}
          inventory={$cityState.inventory}
          onLoad={loadWagonAction}
          onCollect={collectTrainAction}
        />
      {:else if activeTile.kind === "plane"}
        <Plane
          plane={$cityState.plane}
          inventory={$cityState.inventory}
          onLoad={loadPlaneAction}
          onCollect={collectPlaneAction}
        />
      {:else if activeTile.kind === "barn"}
        <BarnPanel
          coins={$cityState.coins}
          barnCapacity={$cityState.barnCapacity}
          barnUpgrades={$cityState.barnUpgrades}
          used={barnUsed($cityState.inventory)}
          materials={$cityState.materials}
          onUpgrade={upgradeBarnAction}
        />
      {:else if activeTile.kind === "build"}
        <BuildPanel
          level={$cityState.level}
          coins={$cityState.coins}
          materials={$cityState.materials}
          buildings={$cityState.buildings}
          town={$town}
          onBuild={buildStructureAction}
          onExpand={expandTownAction}
        />
      {:else if activeTile.kind === "market"}
        <MarketScreen
          level={$cityState.level}
          coins={$cityState.coins}
          inventory={$cityState.inventory}
          {barnFree}
          onBuySeed={buySeedAction}
          onSell={sellItemAction}
        />
      {:else if activeTile.kind === "mine"}
        <MinePanel
          depth={$cityState.mine.depth}
          picks={$cityState.mine.picks}
          coins={$cityState.coins}
          onDig={digMineAction}
          onBuyPicks={buyPicksAction}
        />
      {:else if activeTile.kind === "zoo"}
        <ZooPanel
          zoo={$cityState.zoo}
          inventory={$cityState.inventory}
          onBuild={buildHabitatAction}
        />
      {:else if activeTile.kind === "harbor"}
        <HarborPanel
          harbor={$cityState.harbor}
          inventory={$cityState.inventory}
          onLoad={loadShipAction}
          onCollect={collectShipAction}
        />
      {:else if activeTile.kind === "achievements"}
        <AchievementsPanel state={$cityState} onClaim={claimAchievementAction} />
      {:else if activeTile.kind === "npc"}
        <SquarePanel
          state={$cityState}
          onTalk={talkToAction}
          onRemember={rememberFactAction}
          onCelebrate={celebrateFestivalAction}
        />
      {/if}
      <button type="button" class="close-btn" onclick={closePanel}>Close</button>
    </div>
  </div>
{/if}

<Toasts />

<style>
  .hud {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    /* Respect the landscape safe-area insets (side notch / rounded corners). */
    padding: calc(0.75rem + env(safe-area-inset-top)) calc(1rem + env(safe-area-inset-right))
      calc(0.75rem + env(safe-area-inset-bottom)) calc(1rem + env(safe-area-inset-left));
    pointer-events: none;
  }

  /* The HUD wrapper and its layout containers (header, the badge and action
     rows) stretch the full viewport width but are visually almost entirely
     empty. They must stay transparent to touches so taps fall through to the
     town canvas underneath — only the real controls opt back in. Giving a
     full-width wrapper pointer-events: auto silently eats every tap over the
     farm plots and buildings that render behind it (very visible on iOS,
     where it made the whole upper half of the town uninteractable). */
  .hud,
  .hud header,
  .hud .badges,
  .hud .actions-row,
  .hud .backup-disclosure {
    pointer-events: none;
  }

  .hud button,
  .hud a,
  .hud summary,
  .hud label,
  .hud input,
  .hud select {
    pointer-events: auto;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--ink);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .badge-btn {
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
  }

  .actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--panel);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);
  }

  .chip {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
  }

  .chip.daily {
    background: var(--sun);
  }

  .chip.balloon {
    background: var(--bloom);
  }

  .chip.award {
    background: var(--grass);
  }

  .chip.remember {
    background: var(--panel);
  }

  .chip.setback {
    background: #d9b8a8;
  }

  .chip:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
  }

  .build-btn {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.1rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--panel);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
  }

  .build-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
  }

  .play-btn {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.1rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .play-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .backup-disclosure {
    margin-top: auto;
    align-self: flex-start;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--ink);
    background: rgba(255, 246, 233, 0.85);
    border-radius: 0.75rem;
    padding: 0.4rem 0.6rem;
  }

  .backup-disclosure summary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    user-select: none;
  }

  .backup-disclosure summary img {
    width: 0.85rem;
    height: 0.85rem;
    filter: brightness(0) saturate(100%);
    opacity: 0.85;
  }

  .backup-disclosure :global(.backup) {
    margin-top: 0.75rem;
  }

  .overlay-panel {
    width: min(24rem, 92vw);
  }

  .close-btn {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
    background: rgba(58, 43, 34, 0.12);
    cursor: pointer;
  }
</style>
