import Phaser from "phaser";

// Scenes are added here as they're built. Starting empty on purpose —
// this file grows as Stage 1 progresses (Boot -> Preload -> Board).
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#1a1a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};

new Phaser.Game(config);
