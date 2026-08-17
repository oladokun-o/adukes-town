import Phaser from "phaser";
import { getLevelById } from "@/game/levels";
import { BoardScene } from "@/game/scenes/BoardScene";
import { Hud } from "@/hud/Hud";

const startingLevel = getLevelById("level001");

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

const game = new Phaser.Game(config);

new Hud(() => {
  game.scene.getScene("BoardScene").scene.restart({ level: startingLevel });
});
