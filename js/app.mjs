import startGame from "./game.mjs";
import initWebGL from "./renderer/renderer.mjs";

window.addEventListener("load", (_) => {
    initWebGL();

    startGame();
});