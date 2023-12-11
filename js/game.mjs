import { Mesh } from "./renderer/mesh.mjs";
import { Maze, generateMaze } from "./util/maze-gen.mjs";
import { drawScene, loadTexture } from "./renderer/renderer.mjs";
import BatchInstance from "./renderer/batch-instance.mjs";
import { GetBasicEmissionShaderProgram, GetFullTextureShaderProgram, BasicEmissionMaterial, TestCubeMaterial, BasicShadedMaterial, GetBasicShadedShaderProgram } from "./renderer/materials.mjs";
import { mat4 } from "./util/glMatrix_util.mjs";
import { addVector, dotProductVector, generateCubeMesh, generateGridMesh, magnitudeVector, multVector, normalizeVector, subtractVector } from "./renderer/mesh-handler.mjs";
import CullingFrustum from "./renderer/culling-frustum.mjs";
import refitCanvas from "./util/refit-canvas.mjs";
import Camera from "./components/camera.mjs";
import { gl } from "./renderer/renderer.mjs";
import { requestAnimFrame } from "./util/webgl-utils.mjs";
import { BasicGeometry } from "./renderer/geometry.mjs";
import BatchGeometry from "./renderer/batch-geometry.mjs";
import { parseObjFile } from "./util/obj-parser.mjs"
import { generateContact } from "./physics/physics.mjs";
import Transform from "./components/transform.mjs";

var score = 0;

/**
 * Debug mode can be used to specify alternative rendering methods for certain shaders
 * 
 * 0 - Textured Color
 * 1 - Depth Color
 * 2 - Normals Color
 * 
 * @type {Number}
 */
var debugMode = 0;

var torchIntensity = 1.0;

/** @type {Mesh} */
var batchMesh;

/** @type {Mesh} */
var endMarkerMesh;

/** @type {Transform} */
var endMarkerTransform;

/** @type {Mesh} */
var groundMesh;

var mazeSize = 10;
var mazeDifficulty = 0.5;

/** @type {Maze} */
var maze;

/** @type {Array<Array<String>>} */
var mazeLayout;

/** @type {Array<BatchInstance>} */
var mazeWalls;

/** @type {CullingFrustum} */
var cullingFrustrum;

/** @type {Camera} */
var mainCamera;

var cameraPosition;

var currentMazeRating = 0;

// Initialization

export async function createFloor() {

    const maxHeight = 0.02;

    noise.seed(Date.now());
    var gridMeshHandler = generateCubeMesh();
    var gridGeo = new BasicGeometry(gl, gridMeshHandler);

    var gridMat = new TestCubeMaterial(
        gl,
        await GetFullTextureShaderProgram(gl),
        mainCamera
    );
    gridMat.textureScale = [10.0, 10.0];
    gridMat.specularIntensity = 0.2;
    gridMat.ambientLightColor = [0.2, 0.2, 0.2];
    gridMat.diffuseIntensity = 0.8;
    gridMat.fogRadius = 23.0;

    var transform = new Transform();
    transform.position = [0.0, -0.5, 0.0];
    // transform.scale = [10.0, 10.0, 10.0];

    gridMat.mvMatrix = transform.matrix;

    var mesh = new Mesh(gridGeo, gridMat);

    mesh.material.baseTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_basecolor.jpg");
    mesh.material.normalTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_normal.jpg");
    mesh.material.ambientOcclusionTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_ambientOcclusion.jpg");
    mesh.material.roughnessTexture = loadTexture("./assets/textures/ground-dirt/Ground_Dirt_007_roughness.jpg");

    return mesh;
}

export function updateFloorMesh() {
    var mapVertFunc = (x, gridSize) => {
        return x * ((mazeLayout.length - 1) / (gridSize - 1));
    };

    var mapTexCoordFunc = (x, gridSize) => {
        return x * (1.0 / (gridSize - 1));
    };

    const maxHeight = 0.03;
    var heightFunc = (x, z) => {
        return maxHeight * (noise.simplex2(x * mazeLayout.length * 5.0, z * mazeLayout.length * 5.0) + 1.0) / 2.0;
    };
    
    var gridMeshHandler = generateGridMesh(
        true,
        heightFunc,
        mapVertFunc,
        mapTexCoordFunc,
        16 * mazeLayout.length
    );

    groundMesh.geometry.updateMeshHandler(gl, gridMeshHandler);
    groundMesh.material.textureScale = [1.0 * mazeLayout.length, 1.0 * mazeLayout.length];
}

export function regenMaze() {
    mazeWalls = [];
    maze = generateMaze(mazeSize, mazeSize, mazeDifficulty);
    mazeLayout = maze.getArrayLayout();

    for (var z = 0; z < mazeLayout.length; z++) {
        for (var x = 0; x < mazeLayout[z].length; x++) {
            if (mazeLayout[z][x] == 'X') {
                mazeWalls.push(new BatchInstance(
                    batchMesh.geometry.meshHandler,
                    [x, 0.0, z]
                ));
            }
        }
    }

    // Update markers
    var startPos = addVector(multVector(maze.startPosition, 2.0), [1.0, 0.0, 1.0]);
    // startPos[1] = 0.0;
    var endPos = addVector(multVector(maze.endPosition, 2.0), [1.0, 0.0, 1.0]);
    // endPos[1] = 0.5;

    setMarkerPosition(endMarkerMesh, endMarkerTransform, endPos);

    updateFloorMesh();

    cameraPosition = [startPos[0], 0, startPos[2]];

    if (mazeLayout[startPos[2] + 1][startPos[0]] == ' ') {
        yRot = 180.0;
    } else if (mazeLayout[startPos[2] - 1][startPos[0]] == ' ') {
        yRot = 0.0;
    } else if (mazeLayout[startPos[2]][startPos[0] + 1] == ' ') {
        yRot = -90.0;
    } else if (mazeLayout[startPos[2]][startPos[0] - 2] == ' ') {
        yRot = 90.0;
    }

    currentMazeRating = mazeDifficulty * mazeSize;
}

async function createMazeWallMesh() {
    var cubeMeshHandler = generateCubeMesh();
    // var cubeMeshHandler = parseObjFile(await fetch('assets/meshes/mazeWall.obj', {cache: "no-store"}).then(obj => obj.text()));

    var batchGeo = new BatchGeometry(gl, cubeMeshHandler);

    var testCubeMaterial = new TestCubeMaterial(
        gl,
        await GetFullTextureShaderProgram(gl),
        mainCamera
    );
    testCubeMaterial.textureScale = [1.0, 1.0];
    testCubeMaterial.diffuseIntensity = 1.0;
    testCubeMaterial.specularIntensity = 0.1;
    testCubeMaterial.ambientLightColor = [0.2, 0.4, 0.6];
    testCubeMaterial.fogRadius = 23.0;

    testCubeMaterial.mvMatrix = mat4.identity(mat4.create());

    var mesh = new Mesh(batchGeo, testCubeMaterial);

    mesh.material.baseTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_basecolor.jpg");
    mesh.material.normalTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_normal.jpg");
    mesh.material.ambientOcclusionTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_ambientOcclusion.jpg");
    mesh.material.roughnessTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_roughness.jpg");

    return mesh;
}

async function createMarkerMesh(color) {
    // var cubeMeshHandler = generateCubeMesh();
    var cubeMeshHandler = parseObjFile(await fetch('assets/meshes/endThing.obj', {cache: "no-store"}).then(obj => obj.text()));
    
    var geo = new BasicGeometry(gl, cubeMeshHandler);

    var mat = new BasicShadedMaterial(
        gl,
        await GetBasicShadedShaderProgram(gl),
        mainCamera
    );
    mat.color = color;
    mat.camera = mainCamera;
    mat.ambientLightColor = [0.2, 0.4, 0.6];
    mat.diffuseIntensity = 1.0;
    mat.specularIntensity = 0.4;

    return new Mesh(geo, mat);
}

function setMarkerPosition(markerMesh, transform, position) {
    position[1] = 0.0;
    var mat = markerMesh.material;

    transform.position = position;

    mat.mvMatrix = transform.matrix;
}

async function initMeshes() {
    mainCamera = new Camera(0.01, 25, 45, gl.viewportWidth / gl.viewportHeight);

    batchMesh = await createMazeWallMesh();
    groundMesh = await createFloor();

    endMarkerMesh = await createMarkerMesh([0.3, 0.3, 1.0, 1.0]);
    endMarkerTransform = new Transform();
    endMarkerTransform.scale = [0.25, 0.25, 0.25];

    regenMaze();
    maze.print();

    cullingFrustrum = new CullingFrustum(mainCamera);
}

// Per Frame

var xRot = 0.0;
var yRot = 0.0;
var lightTheta = 0.0;

const cameraSpeed = 2.2;
const cameraSprintSpeed = 4.0;

const physicsEnabled = true;
const lockYMovement = true;

var torchTheta = 0.0;
var endMarkerTheta = 0.0;

function tick(deltaT) {

    if (0.5 > magnitudeVector(subtractVector(endMarkerTransform.position, mainCamera.position))) {
        score += currentMazeRating;
        regenMaze();
        setScoreUI(score.toFixed(1));
    }

    yRot += ((keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0)) * deltaT * 130.0;
    xRot += ((keys['arrowup'] ? 1 : 0) - (keys['arrowdown'] ? 1 : 0)) * deltaT * 60.0;
    xRot = Math.max(-85.0, Math.min(85.0, xRot));
    
    mainCamera.setRotation([xRot, yRot, 0.0]);

    var f = (keys['w'] ? 1.0 : 0.0) + (keys['s'] ? -1.0 : 0.0);
    var r = (keys['d'] ? 1.0 : 0.0) + (keys['a'] ? -1.0 : 0.0);

    var movement = addVector(multVector(mainCamera.right, r), multVector(mainCamera.forward, f));
    if (magnitudeVector(movement) > 1.0) {
        movement = normalizeVector(movement);
    }

    if (lockYMovement) {
        movement[1] = 0.0;
    }

    var cameraDelta = multVector(movement, deltaT * (keys['shift'] ? cameraSprintSpeed : cameraSpeed));
    var projectedPosition = [cameraPosition[0] + cameraDelta[0], cameraPosition[2] + cameraDelta[2]];
    var layoutIndex = [Math.round(projectedPosition[0]), Math.round(projectedPosition[1])];

    if (physicsEnabled) {
        var contactNormals = [];

        if (cameraPosition[1] + cameraDelta[1] < 1.0) {
            for (var z = layoutIndex[1] - 1; z < layoutIndex[1] + 2; z++) {
                for (var x = layoutIndex[0] - 1; x < layoutIndex[0] + 2; x++) {
                    if (z >= 0 && z < mazeLayout.length && x >= 0 && mazeLayout[z].length) {
                        if (mazeLayout[z][x] == 'X') {
                            var norm = generateContact(
                                projectedPosition,
                                0.08,
                                [x, z],
                                0.5
                            );

                            if (norm != null && magnitudeVector(norm) > 0.0001) {
                                contactNormals.push(norm);
                                // console.log(norm);
                            }
                        }
                    }
                }
            }
        }
        
        setIsColliding(contactNormals.length != 0);

        if (contactNormals.length > 0) {
            var maxContact = [0.0, 0.0, 0.0];
            for (var i = 0; i < contactNormals.length; i++) {
                if (Math.abs(maxContact[0]) < Math.abs(contactNormals[i][0])) {
                    maxContact[0] = contactNormals[i][0];
                }
                if (Math.abs(maxContact[2]) < Math.abs(contactNormals[i][2])) {
                    maxContact[2] = contactNormals[i][2];
                }
            }

            var diff = maxContact;
            cameraDelta = subtractVector(cameraDelta, diff);
        }
    }

    // if (collisionNormal) {
    //     console.log(collisionNormal);
    //     cameraDelta = subtractVector(cameraDelta, collisionNormal);
    // }

    cameraPosition = addVector(cameraPosition, cameraDelta);

    mainCamera.setPosition(cameraPosition);

    torchTheta += deltaT * 0.8;
    torchIntensity = noise.simplex2(torchTheta, 2.0 * torchTheta) * 0.1 + 1.0;

    setCameraPositionUI(mainCamera.position);

    const currentMarkerRotation = endMarkerTransform.rotation;
    endMarkerTransform.rotation = [
        currentMarkerRotation[0] + deltaT * 30.0,
        currentMarkerRotation[1] + deltaT * 50.0,
        currentMarkerRotation[2] + deltaT * 80.0
    ];

    endMarkerTheta += deltaT * 1.0;
    const currentMarkerPosition = endMarkerTransform.position;
    endMarkerTransform.position = [
        currentMarkerPosition[0],
        -0.2 + Math.sin(endMarkerTheta) * 0.1,
        currentMarkerPosition[2]
    ];

    var distToEnd = subtractVector(endMarkerTransform.position, cameraPosition);
    distToEnd[1] = 0.0;
    setDistanceUI(magnitudeVector(distToEnd).toFixed(1));

    lightTheta += deltaT * 0.5;
}

function draw() {

    endMarkerMesh.material.mvMatrix = endMarkerTransform.matrix;

    batchMesh.material.directionalLight = [Math.cos(lightTheta), -3.0, Math.sin(lightTheta)];
    groundMesh.material.directionalLight = [Math.cos(lightTheta), -3.0, Math.sin(lightTheta)];
    endMarkerMesh.material.lightDirection = [Math.cos(lightTheta), -3.0, Math.sin(lightTheta)];

    batchMesh.geometry.batchInstances = mazeWalls.filter(x => {
        return cullingFrustrum.testBoundingSphere(x.position, Math.sqrt(3.0));
    });

    const torchPosition = subtractVector(mainCamera.position, [0.0, 0.2, 0.0]);

    batchMesh.material.pointLightPosition = torchPosition;
    groundMesh.material.pointLightPosition = torchPosition;
    endMarkerMesh.material.pointLightPosition = torchPosition;

    batchMesh.material.debugMode = debugMode;
    groundMesh.material.debugMode = debugMode;
    endMarkerMesh.material.debugMode = debugMode;

    batchMesh.material.pointLightIntensity = torchIntensity;
    groundMesh.material.pointLightIntensity = torchIntensity;
    endMarkerMesh.material.pointLightIntensity = torchIntensity;

    drawScene([ batchMesh, endMarkerMesh, groundMesh ]);
}

var lastFrame = Date.now();
function Frames() {
    var now = Date.now();
    var deltaMS = now - lastFrame;
    lastFrame = now;
    setRefreshRate(deltaMS);
    refitCanvas(gl, mainCamera);
    requestAnimFrame(Frames);
    tick(deltaMS / 1000.0);
    draw();
}

function setupEvents() {
    // Input
    var canvas = document.getElementById("hellowebgl");

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    document.getElementById("regen-button").addEventListener("click", (e) => regenMaze());

    setupDebugDropdown();
    setupMazeGenSliders();
}

async function startGame() {
    setupEvents();
    await initMeshes();

    setScoreUI(score);

    Frames();
}

// Input

var lastX, lastY;
var isDown;
var keys = {
    'w': false,
    's': false,
    'a': false,
    'd': false,
    'shift': false,
    'arrowleft': false,
    'arrowright': false
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
        yRot -= (event.layerX - lastX) * 0.7;
        xRot -= (event.layerY - lastY) * 0.7;

        xRot = Math.max(-85.0, Math.min(85.0, xRot));

        lastX = event.layerX;
        lastY = event.layerY;
    }
}

function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

// TEMP UI
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

function setIsColliding(isColliding) {
    document.getElementById("iscol").style.backgroundColor = isColliding ? "#34e363" : "#e33434";
}

function setScoreUI(score) {
    document.getElementById("score").innerHTML = "Score<br />" + score;
}

function setDistanceUI(distance) {
    document.getElementById("dist").innerHTML = "Distance<br />" + distance + " m";
}

function setupDebugDropdown() {
    var select = document.getElementById("debug-select")
    select.addEventListener("change", (e) => {
        debugMode = e.target.value;
    });

    var options = [
        "textured", "depth", "normals", "no direct"
    ];
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.innerHTML = options[i];
        select.appendChild(option);
    }
}

function setupMazeGenSliders() {
    var sizeElem = document.getElementById("maze-size");
    sizeElem.addEventListener("change", (e) => {
        mazeSize = e.target.value;
    });
    sizeElem.value = mazeSize;
    var diffElem = document.getElementById("maze-diff");
    diffElem.addEventListener("change", (e) => {
        mazeDifficulty = e.target.value;
    });
    diffElem.value = mazeDifficulty;
}

export default startGame;