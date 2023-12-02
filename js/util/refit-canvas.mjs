import Camera from "../components/camera.mjs";

/**
 * 
 * @param {WebGLRenderbuffer} gl 
 * @param {Camera} camera 
 */
function refitCanvas(gl, camera) {
    var container = document.getElementById("canvas-container");
    var canvas = document.getElementById("hellowebgl");
    // canvas.clientWidth = container.clientWidth;
    // canvas.clientHeight = container.clientHeight;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    camera.setAspectRatio(gl.viewportWidth / gl.viewportHeight);
}

export default refitCanvas;