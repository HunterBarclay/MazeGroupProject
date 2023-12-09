import { Mesh } from "./renderer/mesh.mjs";
import { Maze, generateMaze } from "./util/maze-gen.mjs";
import { drawScene, loadTexture } from "./renderer/renderer.mjs";
import BatchInstance from "./renderer/batch-instance.mjs";
import { GetBasicEmissionShaderProgram, GetFullTextureShaderProgram, BasicEmissionMaterial, TestCubeMaterial } from "./renderer/materials.mjs";
import { mat4 } from "./util/glMatrix_util.mjs";
import { addVector, dotProductVector, generateCubeMesh, magnitudeVector, multVector, normalizeVector, subtractVector } from "./renderer/mesh-handler.mjs";
import CullingFrustrum from "./renderer/culling-frustrum.mjs";
import refitCanvas from "./util/refit-canvas.mjs";
import Camera from "./components/camera.mjs";
import { gl } from "./renderer/renderer.mjs";
import { requestAnimFrame } from "./util/webgl-utils.mjs";
import { BasicGeometry } from "./renderer/geometry.mjs";
import BatchGeometry from "./renderer/batch-geometry.mjs";
import { parseObjFile } from "./util/obj-parser.mjs"
import { generateContact } from "./physics/physics.mjs";

/** @type {Mesh} */
var batchMesh;

/** @type {Mesh} */
var startMarkerMesh;

/** @type {Mesh} */
var endMarkerMesh;

/** @type {Maze} */
var maze;

/** @type {Array<Array<String>>} */
var mazeLayout;

/** @type {Array<BatchInstance>} */
var mazeWalls;

/** @type {CullingFrustrum} */
var cullingFrustrum;

/** @type {Camera} */
var mainCamera;

var cameraPosition;

// Initialization

export function regenMaze(width, height, difficulty) {
    mazeWalls = [];
    maze = generateMaze(width, height, difficulty);
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

    setMarkerPosition(startMarkerMesh, startPos);
    setMarkerPosition(endMarkerMesh, endPos);

    cameraPosition = [startPos[0], 0, startPos[2]];
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
    testCubeMaterial.specularIntensity = 0.1;
    testCubeMaterial.ambientLightColor = [0.2, 0.4, 0.6];
    testCubeMaterial.fogRadius = 135.0;

    testCubeMaterial.mvMatrix = mat4.identity(mat4.create());

    var mesh = new Mesh(batchGeo, testCubeMaterial);

    mesh.material.baseTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_basecolor.jpg");
    mesh.material.normalTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_normal.jpg");
    mesh.material.ambientOcclusionTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_ambientOcclusion.jpg");
    mesh.material.roughnessTexture = loadTexture("./assets/textures/style-grass/Stylized_Grass_002_roughness.jpg");

    return mesh;
}

async function createMarkerMesh(color) {
    var cubeMeshHandler = generateCubeMesh();
    // var cubeMeshHandler = parseObjFile(await fetch('assets/meshes/mazeWall.obj', {cache: "no-store"}).then(obj => obj.text()));
    
    var geo = new BasicGeometry(gl, cubeMeshHandler);

    var mat = new BasicEmissionMaterial(
        gl,
        await GetBasicEmissionShaderProgram(gl),
        mainCamera
    );
    mat.color = color;
    mat.camera = mainCamera;

    return new Mesh(geo, mat);
}

function setMarkerPosition(markerMesh, position) {
    position[1] = 2.0;
    var mat = markerMesh.material;
    var transform = mat4.identity(mat4.create());
    mat.mvMatrix = mat4.scale(mat4.translate(transform, position), [0.2, 5.0, 0.2]);
}

async function initMeshes() {
    mainCamera = new Camera(0.01, 140, 45, gl.viewportWidth / gl.viewportHeight);

    batchMesh = await createMazeWallMesh();

    startMarkerMesh = await createMarkerMesh([1.0, 0.3, 0.3, 1.0]);
    endMarkerMesh = await createMarkerMesh([0.3, 0.3, 1.0, 1.0]);

    regenMaze(10, 10, 0.7);
    maze.print();

    cullingFrustrum = new CullingFrustrum(mainCamera);
}

// Per Frame

var xRot = 0.0;
var yRot = 0.0;
var lightTheta = 0.0;

const cameraSpeed = 2.2;
const cameraSprintSpeed = 4.0;

function tick(deltaT) {
    
    mainCamera.setRotation([xRot, yRot, 0.0]);

    var f = (keys['w'] ? 1.0 : 0.0) + (keys['s'] ? -1.0 : 0.0);
    var r = (keys['d'] ? 1.0 : 0.0) + (keys['a'] ? -1.0 : 0.0);

    var movement = addVector(multVector(mainCamera.right, r), multVector(mainCamera.forward, f));
    if (magnitudeVector(movement) > 1.0) {
        movement = normalizeVector(movement);
    }
    movement[1] = 0.0;

    var cameraDelta = multVector(movement, deltaT * (keys['shift'] ? cameraSprintSpeed : cameraSpeed));
    var projectedPosition = [cameraPosition[0] + cameraDelta[0], cameraPosition[2] + cameraDelta[2]];
    var layoutIndex = [Math.round(projectedPosition[0]), Math.round(projectedPosition[1])];

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

    // if (collisionNormal) {
    //     console.log(collisionNormal);
    //     cameraDelta = subtractVector(cameraDelta, collisionNormal);
    // }

    cameraPosition = addVector(cameraPosition, cameraDelta);

    mainCamera.setPosition(cameraPosition);

    

    setCameraPositionUI(mainCamera.position);

    lightTheta += deltaT * 1.0;
}

function draw() {

    batchMesh.material.directionalLight = [Math.cos(lightTheta), -7.0, Math.sin(lightTheta)];
    batchMesh.geometry.batchInstances = mazeWalls.filter(x => {
        return cullingFrustrum.testBoundingSphere(x.position, Math.sqrt(3.0));
    });
    batchMesh.material.pointLightPosition = batchMesh.material.camera.position;

    drawScene([ batchMesh, startMarkerMesh, endMarkerMesh ]);
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
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    document.getElementById("regen-button").addEventListener("click", (e) => regenMaze(10, 10, 0.7));
}

async function startGame() {
    setupEvents();
    await initMeshes();
    Frames();
}

// Input

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

export default startGame;