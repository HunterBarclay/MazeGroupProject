import { mat4 } from "../util/glMatrix_util.js";
import { requestAnimFrame } from "../util/webgl-utils.js";
import BatchInstance from "./batch-instance.mjs";
import { generateCubeMesh, addVector, normalizeVector } from "./mesh-handler.mjs";
import Camera from "../components/camera.mjs";
import { parseObjFile } from "../util/obj-parser.mjs";

var gl;

function initWebGLContext(aname) {
    gl = null;
    var canvas = document.getElementById(aname);
    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch (e) { }

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        gl = null;
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return gl;
}
// define the function to initial WebGL and Setup Geometry Objects
function initGLScene() {
    // Initialize the WebGL Context - the gl engine for drawing things.
    var gl = initWebGLContext("hellowebgl"); // The id of the Canvas Element
    if (!gl) // if fails simply return
    {
        return;
    }
    // succeeded in initializing WebGL system
    return gl;
}


async function getShader(gl, type, src) {
    var str = await fetch(src, {cache: "no-store"}).then(x => x.text());

    var shader;
    if (type == "frag") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vert") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

async function initShaders() {
    var fragmentShader = await getShader(gl, "frag", "/shaders/test-cube-fs.glsl");
    var vertexShader = await getShader(gl, "vert", "/shaders/test-cube-vs.glsl");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    if (shaderProgram.vertexPositionAttribute == -1) {
        console.error("Can't find position attr");
    }
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    if (shaderProgram.textureCoordAttribute == -1) {
        console.error("Can't find texCoord attr");
    }
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    if (shaderProgram.vertexNormalAttribute == -1) {
        console.error("Can't find normal attr");
    }
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

    shaderProgram.dirLight = gl.getUniformLocation(shaderProgram, "uDirLight");
}



// create our basic model and view matrix
var mvMatrix = mat4.create();
var lightVec = [0.0, -1.0, 0.0];
var mvMatrixStack = [];
// create our projection matrix for projecting from 3D to 2D.
var pMatrix = mat4.create();
var vMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
    gl.uniform3fv(shaderProgram.dirLight, normalizeVector(lightVec));
}

function generateViewMatrix(eyePos, lookDir = [0.0, 0.0, -1.0], up = [0.0, 1.0, 0.0]) {
    var m = mat4.lookAt(eyePos, addVector(eyePos, lookDir), up);
    return m;
}

// create and initialize our geometry objects
var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexNormalBuffer;

var objMeshHandler;
var cubeBatchInstance;

function initGeometry() {
    
    // cubeBatchInstance = new BatchInstance(generateCubeMesh(), [0.0, 0.0, 0.0]);
    cubeBatchInstance = new BatchInstance(objMeshHandler, [0.0, 0.0, 0.0]);

    cubeVertexPositionBuffer = gl.createBuffer();
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = cubeBatchInstance.getVertexBufferLength() / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * cubeBatchInstance.getVertexBufferLength(), gl.STATIC_DRAW);

    cubeVertexIndexBuffer = gl.createBuffer();
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = cubeBatchInstance.getIndexBufferLength();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint32Array.BYTES_PER_ELEMENT * cubeBatchInstance.getIndexBufferLength(), gl.STATIC_DRAW);

    cubeVertexNormalBuffer = gl.createBuffer();
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = cubeBatchInstance.getNormalBufferLength() / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * cubeBatchInstance.getNormalBufferLength(), gl.STATIC_DRAW);

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = cubeBatchInstance.getTexCoordBufferLength() / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * cubeBatchInstance.getTexCoordBufferLength(), gl.STATIC_DRAW);

    cubeBatchInstance.writeInstanceToBuffer(
        gl,
        0, cubeVertexPositionBuffer,
        0, cubeVertexIndexBuffer,
        0, cubeVertexNormalBuffer,
        0, cubeVertexTextureCoordBuffer
    );
}


// Initialize our texture data and prepare it for rendering
var normalMapTexture;

function initTextures() {
    normalMapTexture = loadTexture("./textures/normalMap.png");
}

function loadTexture(path) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () {
        handleLoadedTexture(texture);
    }

    texture.image.src = path;
    return texture;
}

function handleLoadedTexture(texture) {
    // configure the texture handle for use by the GPU
    // has nothing to do with the pixel unpacking
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var camera;

//Initialize everything for starting up a simple webGL application
async function startHelloWebGL() {
    // attach 'Handler' functions to handle events generated by the canvas.
    // for when the browser is resized or closed.

    console.log("Starting...");

    // first initialize webgl components
    var gl = initGLScene();

    // objMeshHandler = parseObjFile(await fetch('suzanne.obj', {cache: "no-store"}).then(obj => obj.text()));
    objMeshHandler = generateCubeMesh();

    // now build basic geometry objects.
    await initShaders();
    initTextures();
    initGeometry();

    camera = new Camera(0.01, 50, 45, gl.viewportWidth / gl.viewportHeight);
    /// camera.setPosition([0.0, 0.0, -5.0]);

    // Found blend function here: https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    //   I actually found the blend stuff from someone having an issue, but I justed wanted alpha to do anything
    gl.clearColor(0.4, 0.4, 0.4, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Draw the Scene
    Frames();
    // If doing an animation need to add code to rotate our geometry

}

// This function draws a basic webGL scene
// first it clears the framebuffer.
// then we define our View positions for our camera using WebGL matrices.
// OpenGL has convenience methods for this such as glPerspective().
// finally we call the gl draw methods to draw our defined geometry objects.
var xRot = 0;
var yRot = 0;
var zRot = 0;
var zPos = -5.0;

const speed = 0.002;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.001, 30.0, pMatrix);
    camera.setPosition([0.0, 0.0, zPos]);
    pMatrix = camera.getProjection();

    mat4.identity(mvMatrix);
    mat4.rotate(mvMatrix, xRot / 180.0 * 3.1415, [1, 0, 0]);
    mat4.rotate(mvMatrix, yRot / 180.0 * 3.1415, [0, 1, 0]);
    mat4.rotate(mvMatrix, zRot / 180.0 * 3.1415, [0, 0, 1]);

    vMatrix = camera.getTransformation();
    // mvMatrix = mat4.multiply(mat4.inverse(mvMatrix), vMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, normalMapTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();

    // Drawing ints not shorts. CREDIT: https://computergraphics.stackexchange.com/questions/3637/how-to-use-32-bit-integers-for-element-indices-in-webgl-1-0
    var uints_for_indices = gl.getExtension("OES_element_index_uint");
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_INT, 0);
}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        // here we could change variables to adjust rotations for animation
        // yRot += elapsed * 0.05;
        // zRot += elapsed * 0.1;
        // xRot += elapsed * 0.2;
    }
    lastTime = timeNow;
}

function Frames() {
    requestAnimFrame(Frames);
    drawScene();
    animate();
}

/// USER INTERACTION EVENTS
/// Sources: https://www.w3schools.com/jsref/obj_mouseevent.asp

var lastX, lastY;
var isDown;
var keys = {
    'w': false,
    's': false,
    'a': false,
    'd': false
};

function onMouseDown(event) {
    lastX = event.layerX;
    lastY = event.layerY;

    isDown = true;
}

function onMouseUp(event) {
    isDown = false;
}

function onMouseMove(event) {
    if (isDown) {
        if (event.shiftKey) { // If Shift, zoom
            zPos += (event.layerY - lastY) * -0.03;
            zPos = Math.max(Math.min(zPos, 0), -7);
            // 
        } else { // If not, rotate
            yRot += (event.layerX - lastX) * 0.7;
            xRot += (event.layerY - lastY) * 0.7;
        }

        lastX = event.layerX;
        lastY = event.layerY;
    }
}

function onKeyDown(event) {
    keys[event.key] = true;
}

function onKeyUp(event) {
    keys[event.key] = false;
}

// EXPORTS

export default startHelloWebGL;