<script lang="ts">
  import { exportSaveJson, importSaveJson } from "@/save/backup";
  import { pullFromCloud, pushToCloud } from "@/save/cloudSync";

  let fileInput: HTMLInputElement | undefined = $state();
  let status: string = $state("");
  let syncing: boolean = $state(false);

  function downloadJson(filename: string, json: string): void {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportSave(): void {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`adukes-town-save-${date}.json`, exportSaveJson());
    status = "Save exported.";
  }

  function triggerImport(): void {
    fileInput?.click();
  }

  async function onFileSelected(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    try {
      await importSaveJson(await file.text());
      status = "Save restored.";
    } catch (err) {
      status = err instanceof Error ? err.message : "Couldn't restore that save file.";
    }
  }

  async function syncToCloud(): Promise<void> {
    syncing = true;
    try {
      await pushToCloud();
      status = "Synced to cloud.";
    } catch (err) {
      status = err instanceof Error ? err.message : "Couldn't sync to the cloud.";
    } finally {
      syncing = false;
    }
  }

  async function restoreFromCloud(): Promise<void> {
    syncing = true;
    try {
      const restored = await pullFromCloud();
      status = restored ? "Save restored from the cloud." : "No cloud save found yet.";
    } catch (err) {
      status = err instanceof Error ? err.message : "Couldn't restore from the cloud.";
    } finally {
      syncing = false;
    }
  }
</script>

<div class="backup">
  <button type="button" onclick={exportSave}>Export Save</button>
  <button type="button" onclick={triggerImport}>Import Save</button>
  <button type="button" disabled={syncing} onclick={syncToCloud}>Sync to Cloud</button>
  <button type="button" disabled={syncing} onclick={restoreFromCloud}>Restore from Cloud</button>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json"
    hidden
    onchange={onFileSelected}
  />
  {#if status}
    <p class="status">{status}</p>
  {/if}
</div>

<style>
  .backup {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  button {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f5f5f7;
    background: transparent;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .status {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(245, 245, 247, 0.75);
    width: 100%;
  }
</style>
