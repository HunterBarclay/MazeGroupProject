import { 
    generateGrid, addVector, multVector, magnitudeVector,
    makePerpendicular, normalizeVector, toRadians,
    crossProductVector, gridSize
} from "../util/mesh-gen.js";

import { mat4 } from "../glMatrix_util.js";

import { requestAnimFrame } from "../webgl-utils.js";

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


async function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        console.log("Can't find shader script");
        return null;
    }

    var str = await fetch(shaderScript.src).then(x => x.text());

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
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
    var fragmentShader = await getShader(gl, "shader-fs");
    var vertexShader = await getShader(gl, "shader-vs");

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
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    // shaderProgram.normalMap = gl.getUniformLocation(shaderProgram, "uNormalMap");

    shaderProgram.dirLight = gl.getUniformLocation(shaderProgram, "uDirLight");
}



// create our basic model and view matrix
var mvMatrix = mat4.create();
var lightVec = [1.0, -1.0, -1.0];
var mvMatrixStack = [];
// create our projection matrix for projecting from 3D to 2D.
var pMatrix = mat4.create();

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

var normalBuffer;

function initGeometry() {
    
    const [v, i, t, n] = generateGrid(true, getTerrainHeight);

    normalBuffer = n;

    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var vertices = v;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = v.length / 3;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = t;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = t.length / 3;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = i;
    // Ints instead of shorts
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = i.length;

    cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = n.length / 3;
}


// Initialize our texture data and prepare it for rendering
// var rainbowTexture;
// var monaLisaTexture;
var heightTexture;
var Gpixels = null;

function initTextures() {
    // rainbowTexture = loadTexture("./textures/rainbow.png");
    // monaLisaTexture = loadTexture("./textures/monalisa.jpg");
    heightTexture = loadTexture("./textures/terrain.png", true);
}

function loadTexture(path, loadInJS = false) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () {
        handleLoadedTexture(texture, loadInJS)

        if (loadInJS) {
            console.log("initing geometry");
            initGeometry();
        }
    }

    // exTexture.image.src = "./box.png";
    texture.image.src = path;
    return texture;
}

function handleLoadedTexture(texture, loadInJS = false) {
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // // CREDIT: https://stackoverflow.com/questions/3792027/webgl-and-the-power-of-two-image-size
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.bindTexture(gl.TEXTURE_2D, null);

    // configure the texture handle for use by the GPU
    // has nothing to do with the pixel unpacking
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    if (loadInJS) {
        // alocate the array for holding the RGBA pixel data
        Gpixels = {
            width: texture.image.width,
            height: texture.image.height,
            pixels: new Uint8Array(4 * texture.image.width * texture.image.height)
        }
        
        // here we use a framebuffer as an offscreen render object
        // draw the texture into it and then copy the pixel values into a local array.
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
            gl.readPixels(0, 0, Gpixels.width, Gpixels.height, gl.RGBA, gl.UNSIGNED_BYTE, Gpixels.pixels);
            console.log("Read into buffer");
        } else {
            console.log("Just straight up not reading pixels lmao");
        }
        
        // unbind this framebuffer so its memory can be reclaimed.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);


}

function getTerrainHeight(s, t) {

    s = Math.min(Math.max(s, 0.0), 1.0);
    t = Math.min(Math.max(t, 0.0), 1.0);

    var sCoord = Math.floor(s * (Gpixels.width - 0.01));
    var tCoord = Math.floor(t * (Gpixels.height - 0.01));

    var index = (tCoord * Gpixels.width + sCoord) * 4;
    var color = [Gpixels.pixels[index], Gpixels.pixels[index] + 1, Gpixels.pixels[index] + 2];

    return (magnitudeVector(color) / 256.0) * 0.3 + 0.6;
    // return Math.sin((s + t) * 35) * 0.1 + 0.8;
}

function getNormal(x, z) {
    x = x * 0.5 + 0.5;
    z = z * 0.5 + 0.5;
    
    var xDec = Math.min(Math.max(x * gridSize, 0), gridSize - 1);
    var zDec = Math.min(Math.max(z * gridSize, 0), gridSize - 1);
    x = Math.floor(xDec);
    z = Math.floor(zDec);
    var offset = 0;
    if ((xDec - x) + (zDec - z) > 1.0) { // Determine which triangle to use
        offset = 9;
    }

    var index = (x * gridSize + z) * 18;
    var normal = [normalBuffer[index + offset], normalBuffer[index + offset + 1], normalBuffer[index + offset + 2]];

    return normal;
}

//Initialize everything for starting up a simple webGL application
async function startHelloWebGL() {
    // attach 'Handler' functions to handle events generated by the canvas.
    // for when the browser is resized or closed.

    console.log("Starting...");

    // first initialize webgl components
    var gl = initGLScene();

    // now build basic geometry objects.
    await initShaders();
    initTextures();
    // initGeometry();

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
var zPos = -3.0;

var position = [0.0, 1.0, 0.0];
var forward = [0.0, 0.0, -1.0];
var right = [-1.0, 0.0, 0.0];
const speed = 0.002;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    forward = [Math.sin(toRadians(yRot)), 0.0, -Math.cos(toRadians(yRot))];
    right = crossProductVector(forward, [0.0, 1.0, 0.0]);

    var vertMovement = (keys['w'] === true ? 1.0 : 0.0) + (keys['s'] ? -1.0 : 0.0);
    var horizMovement = (keys['d'] === true ? 1.0 : 0.0) + (keys['a'] ? -1.0 : 0.0);

    var delta = multVector(normalizeVector(addVector(multVector(forward, vertMovement), multVector(right, horizMovement))), speed);
    position = addVector(position, delta);

    position[0] = Math.min(Math.max(position[0], -0.95), 0.95);
    position[2] = Math.min(Math.max(position[2], -0.95), 0.95);

    position[1] = getTerrainHeight((position[0] * 0.5) + 0.5, (position[2] * 0.5) + 0.5) + 0.03;

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.001, 30.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, 0.0 / 180.0 * 3.1415, [1, 0, 0]);
    mat4.rotate(mvMatrix, 0.0 / 180.0 * 3.1415, [0, 1, 0]);
    mat4.rotate(mvMatrix, 0.0 / 180.0 * 3.1415, [0, 0, 1]);

    var up = getNormal(position[0], position[2]);
    forward = makePerpendicular(up, forward);

    const vMatrix = generateViewMatrix(position, forward, up);
    mat4.multiply(mvMatrix, vMatrix);

    setPosition(position);

    // console.log(mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, smileTexture);
    // gl.bindTexture(gl.TEXTURE_2D, flagTexture);
    // gl.bindTexture(gl.TEXTURE_2D, alphaTestTexture);
    // gl.bindTexture(gl.TEXTURE_2D, rainbowTexture);
    // gl.bindTexture(gl.TEXTURE_2D, monaLisaTexture);
    gl.bindTexture(gl.TEXTURE_2D, heightTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    // gl.activeTexture(gl.TEXTURE1);
    // gl.bindTexture(gl.TEXTURE_2D, noiseNormalTexture);
    // gl.uniform1i(shaderProgram.normalMap, 1);

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

    if (Gpixels !== null) {
        drawScene();
        animate();
    }
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
            zPos = Math.max(Math.min(zPos, 0), -3);
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

/// FEEDBACK

function setPosition(pos) {
    document.getElementById("cam-position").innerHTML = "(" + pos[0] + ", " + pos[1] + ", " + pos[2] + ")";
}

// EXPORTS

export default startHelloWebGL;