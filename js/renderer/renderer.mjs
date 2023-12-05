import { mat4 } from "../util/glMatrix_util.mjs";
import { requestAnimFrame } from "../util/webgl-utils.mjs";
import BatchInstance from "./batch-instance.mjs";
import MeshHandler, { generateCubeMesh, addVector, normalizeVector, multVector } from "./mesh-handler.mjs";
import Camera from "../components/camera.mjs";
import { parseObjFile } from "../util/obj-parser.mjs";
import refitCanvas from "../util/refit-canvas.mjs";
import { TestCubeMaterial, getShaderProgram } from "./materials.mjs";
import BatchGeometry from "./batch-geometry.mjs";
import { Mesh } from "./mesh.mjs";
import { Maze, generateMaze } from "../util/maze-gen.mjs";
import CullingFrustrum from "./culling-frustrum.mjs";

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

// create and initialize our geometry objects
var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexNormalBuffer;

var cubeBatchInstance;

/** @type {BatchGeometry} */
var batchGeo;

/** @type {MeshHandler} */
var cubeMeshHandler;

/** @type {TestCubeMaterial} */
var testCubeMaterial;

/** @type {Mesh} */
var batchMesh;

/** @type {Maze} */
var maze;

/** @type {Array<BatchInstance>} */
var mazeWalls;

/** @type {CullingFrustrum} */
var cullingFrustrum;

export function regenMaze(width, height, difficulty) {
    mazeWalls = [];
    maze = generateMaze(width, height, difficulty);
    var mazeLayout = maze.getArrayLayout();

    for (var z = 0; z < mazeLayout.length; z++) {
        for (var x = 0; x < mazeLayout[z].length; x++) {
            if (mazeLayout[z][x] == 'X') {
                mazeWalls.push(new BatchInstance(
                    cubeMeshHandler,
                    [x * 2.0, 0.0, z * 2.0]
                ));
            }
        }
    }
}

async function initMeshes() {
    const numBatchInstances = 4; // If not specified, will calculate

    cubeMeshHandler = generateCubeMesh();
    console.log(cubeMeshHandler.getByteSize());
    // cubeMeshHandler = parseObjFile(await fetch('assets/meshes/sphere.obj', {cache: "no-store"}).then(obj => obj.text()));
    batchGeo = new BatchGeometry(gl, cubeMeshHandler /*, numBatchInstances */);

    testCubeMaterial = new TestCubeMaterial(
        gl,
        await getShaderProgram(gl, "./shaders/test-cube-vs.glsl", "./shaders/test-cube-fs.glsl")
    );

    testCubeMaterial.camera = new Camera(0.01, 140, 45, gl.viewportWidth / gl.viewportHeight);
    testCubeMaterial.textureScale = [1.0, 1.0];
    testCubeMaterial.specularIntensity = 0.1;
    testCubeMaterial.ambientLightColor = [0.2, 0.4, 0.6];
    testCubeMaterial.fogRadius = 135.0;

    testCubeMaterial.mvMatrix = mat4.identity(mat4.create());

    batchMesh = new Mesh(batchGeo, testCubeMaterial);

    regenMaze(50, 50, 0.5);

    cullingFrustrum = new CullingFrustrum(testCubeMaterial.camera);
}

function initTextures() {
    testCubeMaterial.baseTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_basecolor.jpg");
    testCubeMaterial.normalTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_normal.jpg");
    testCubeMaterial.ambientOcclusionTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_ambientOcclusion.jpg");
    testCubeMaterial.roughnessTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_roughness.jpg");

    // testCubeMaterial.baseTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Base_Color.jpg");
    // testCubeMaterial.normalTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Normal.jpg");
    // testCubeMaterial.ambientOcclusionTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_ambientOcclusion.jpg");
    // testCubeMaterial.roughnessTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Roughness.jpg");

    // testCubeMaterial.baseTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_basecolor.jpg");
    // testCubeMaterial.normalTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_normal.jpg");
    // testCubeMaterial.ambientOcclusionTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_ambientocclusion.jpg");
    // testCubeMaterial.roughnessTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_roughness.jpg");

    // baseTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_basecolor.jpg");
    // normalTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_normal.jpg");
    // ambientOccTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_ambientOcclusion.jpg");
    // roughnessTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_roughness.jpg");

    // testCubeMaterial.baseTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_basecolor.jpg");
    // testCubeMaterial.normalTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_normal.jpg");
    // testCubeMaterial.ambientOcclusionTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_ambientOcclusion.jpg");
    // testCubeMaterial.roughnessTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_roughness.jpg");
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

//Initialize everything for starting up a simple webGL application
async function startHelloWebGL() {
    // attach 'Handler' functions to handle events generated by the canvas.
    // for when the browser is resized or closed.

    console.log("Starting...");

    // first initialize webgl components
    var gl = initGLScene();
    // Drawing ints not shorts. CREDIT: https://computergraphics.stackexchange.com/questions/3637/how-to-use-32-bit-integers-for-element-indices-in-webgl-1-0
    var uints_for_indices = gl.getExtension("OES_element_index_uint");
    // objMeshHandler = generateCubeMesh();

    await initMeshes();
    initTextures();

    // Found blend function here: https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    //   I actually found the blend stuff from someone having an issue, but I justed wanted alpha to do anything
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // Back face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    // TODO: Prolly fix alpha or remove it. CREDIT: https://www.khronos.org/opengl/wiki/Face_Culling
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // Draw the Scene
    Frames();
    // If doing an animation need to add code to rotate our geometry

}

// This function draws a basic webGL scene
// first it clears the framebuffer.
// then we define our View positions for our camera using WebGL matrices.
// OpenGL has convenience methods for this such as glPerspective().
// finally we call the gl draw methods to draw our defined geometry objects.
var xRot = -20.0;
var yRot = 225.0;
var zRot = 0;
var zPos = -5.0;
var lightTheta = 0.0;
var cameraPosition = [0.0, 4.0, 0.0];

const speed = 0.002;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.001, 30.0, pMatrix);
    // testCubeMaterial.camera.setPosition([0.0, 0.0, zPos]);

    testCubeMaterial.directionalLight = [Math.cos(lightTheta), -6.0, Math.sin(lightTheta)];

    testCubeMaterial.camera.setRotation([xRot, yRot, 0.0]);

    var f = (keys['w'] ? 1.0 : 0.0) + (keys['s'] ? -1.0 : 0.0);
    var r = (keys['d'] ? 1.0 : 0.0) + (keys['a'] ? -1.0 : 0.0);
    cameraPosition = addVector(cameraPosition, multVector(testCubeMaterial.camera.forward, f * 0.2));
    cameraPosition = addVector(cameraPosition, multVector(testCubeMaterial.camera.right, r * 0.2));

    testCubeMaterial.camera.setPosition(cameraPosition);

    batchMesh.geometry.batchInstances = mazeWalls.filter(x => {
        return cullingFrustrum.testBoundingSphere(x.position, Math.sqrt(3.0));
    });

    setCameraPositionUI(testCubeMaterial.camera.position);
    batchMesh.draw(gl);
}


var lastTime = 0;

function animate() {
    var timeNow = Date.now();
    if (lastTime != 0) {
        var elapsedMs = timeNow - lastTime;

        setRefreshRate(elapsedMs);

        var elapsedS = elapsedMs / 1000.0;
        lightTheta += 1.3 * elapsedS;

        // here we could change variables to adjust rotations for animation
        // yRot += elapsed * 0.05;
        // zRot += elapsed * 0.1;
        // xRot += elapsed * 0.2;
    }
    lastTime = timeNow;
}



function Frames() {
    refitCanvas(gl, testCubeMaterial.camera);
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
            zPos = Math.max(Math.min(zPos, 0), -40);
            // 
        } else { // If not, rotate
            yRot -= (event.layerX - lastX) * 0.7;
            xRot -= (event.layerY - lastY) * 0.7;
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

// FEEDBACK

function setRefreshRate(ms) {
    const fps = (1000.0 / ms).toFixed(1);
    document.getElementById("framerate").innerHTML = ms + " ms (" + fps + " fps)";
}

export function setBatchesDrawn(count) {
    document.getElementById("batches").innerHTML = count + " batches";
}

export function setMeshesDrawn(count) {
    document.getElementById("meshes").innerHTML = count + " meshes";
}

export function setCameraPositionUI(pos) {
    document.getElementById("campos").innerHTML = "(" + pos.map(x => x.toFixed(2)).join(", ") + ")";
}

// EXPORTS

export default startHelloWebGL;