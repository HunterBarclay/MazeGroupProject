import { testCamera } from "./components/camera.mjs";
import { testCullingFrustrum } from "./renderer/culling-frustrum.mjs";
import startHelloWebGL from "./renderer/renderer.js";

window.addEventListener("load", (_) => {

    // testCamera();
    // testCullingFrustrum();

    startHelloWebGL();
});