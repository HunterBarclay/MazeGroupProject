import { mat4 } from "../util/glMatrix_util.js";
import { requestAnimFrame } from "../util/webgl-utils.js";
import BatchInstance from "./batch-instance.mjs";
import MeshHandler, { generateCubeMesh, addVector, normalizeVector } from "./mesh-handler.mjs";
import Camera from "../components/camera.mjs";
import { parseObjFile } from "../util/obj-parser.mjs";
import refitCanvas from "../util/refit-canvas.mjs";
import { TestCubeMaterial, getShaderProgram } from "./materials.mjs";
import BatchGeometry from "./batch-geometry.mjs";
import { Mesh } from "./mesh.mjs";

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

var objMeshHandler;
var cubeBatchInstance;

/** @type {BatchGeometry} */
var batchGeo;

/** @type {MeshHandler} */
var cubeMeshHandler;

/** @type {TestCubeMaterial} */
var testCubeMaterial;

/** @type {Mesh} */
var batchMesh;

//cubeBatchInstance needs to be initialized
async function initMeshes() {
    const numBatchInstances = 7;

    cubeMeshHandler = generateCubeMesh();
    batchGeo = new BatchGeometry(gl, cubeMeshHandler, numBatchInstances);

    testCubeMaterial = new TestCubeMaterial(
        gl,
        await getShaderProgram(gl, "./shaders/test-cube-vs.glsl", "./shaders/test-cube-fs.glsl")
    );

    testCubeMaterial.camera = new Camera(0.01, 50, 45, gl.viewportWidth / gl.viewportHeight);
    testCubeMaterial.textureScale = [5.0, 5.0];
    testCubeMaterial.specularIntensity = 0.6;

    batchMesh = new Mesh(batchGeo, testCubeMaterial);
}

function initTextures() {
    // baseTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_basecolor.jpg");
    // normalTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_normal.jpg");
    // ambientOccTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_ambientOcclusion.jpg");
    // roughnessTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_roughness.jpg");

    // baseTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Base_Color.jpg");
    // normalTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Normal.jpg");
    // ambientOccTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_ambientOcclusion.jpg");
    // roughnessTexture = loadTexture("./assets/textures/style-brick/Terracotta_Tiles_002_Roughness.jpg");

    // baseTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_basecolor.jpg");
    // normalTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_normal.jpg");
    // ambientOccTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_ambientocclusion.jpg");
    // roughnessTexture = loadTexture("./assets/textures/style-brick2/Stylized_Bricks_002_roughness.jpg");

    // baseTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_basecolor.jpg");
    // normalTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_normal.jpg");
    // ambientOccTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_ambientOcclusion.jpg");
    // roughnessTexture = loadTexture("./assets/textures/style-dry-mud/Stylized_Dry_Mud_001_roughness.jpg");

    testCubeMaterial.baseTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_basecolor.jpg");
    testCubeMaterial.normalTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_normal.jpg");
    testCubeMaterial.ambientOcclusionTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_ambientOcclusion.jpg");
    testCubeMaterial.roughnessTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_roughness.jpg");
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

    objMeshHandler = parseObjFile(await fetch('assets/meshes/sphere.obj', {cache: "no-store"}).then(obj => obj.text()));
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

    const instances = [
        new BatchInstance(cubeMeshHandler, [-0.7,  0.0,  0.0]),
        new BatchInstance(cubeMeshHandler, [ 0.0,  0.0,  0.0]),
        new BatchInstance(cubeMeshHandler, [ 0.7,  0.0,  0.0]),
        new BatchInstance(cubeMeshHandler, [ 0.0,  0.7,  0.0]),
        new BatchInstance(cubeMeshHandler, [ 0.0, -0.7,  0.0]),
        new BatchInstance(cubeMeshHandler, [ 0.0,  0.0,  0.7]),
        new BatchInstance(cubeMeshHandler, [ 0.0,  0.0, -0.7])
    ];

    batchGeo.batchInstances = instances;
    
    // mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.001, 30.0, pMatrix);
    testCubeMaterial.camera.setPosition([0.0, 0.0, zPos]);

    var mvMatrix = mat4.create();
    mat4.identity(mvMatrix);
    mat4.rotate(mvMatrix, xRot / 180.0 * 3.1415, [1, 0, 0]);
    mat4.rotate(mvMatrix, yRot / 180.0 * 3.1415, [0, 1, 0]);
    mat4.rotate(mvMatrix, zRot / 180.0 * 3.1415, [0, 0, 1]);

    testCubeMaterial.mvMatrix = mvMatrix;


    // TODO: Update to have batches
    // testCubeMaterial.loadUniforms(gl);
    // testCubeMaterial.bindVertexPointers(
    //     gl,
    //     cubeVertexPositionBuffer,
    //     cubeVertexNormalBuffer,
    //     cubeVertexTextureCoordBuffer,
    //     cubeVertexIndexBuffer
    // );

    // gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_INT, 0);

    batchMesh.draw(gl);
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