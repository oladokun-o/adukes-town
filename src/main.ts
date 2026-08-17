import Phaser from "phaser";
import { BoardScene } from "@/game/scenes/BoardScene";

// Scenes are added here as they're built.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#1a1a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BoardScene],
};

new Phaser.Game(config);
