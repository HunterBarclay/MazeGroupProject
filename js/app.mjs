import { testCullingFrustrum } from "./renderer/culling-frustrum.mjs";
import startHelloWebGL from "./renderer/renderer.mjs";
import { mat4 } from "./util/glMatrix_util.mjs";

window.addEventListener("load", (_) => {

    testCullingFrustrum();

    startHelloWebGL();
});