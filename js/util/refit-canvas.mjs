function refitCanvas(gl) {
    var container = document.getElementById("canvas-container");
    var canvas = document.getElementById("hellowebgl");
    // canvas.clientWidth = container.clientWidth;
    // canvas.clientHeight = container.clientHeight;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

export default refitCanvas;