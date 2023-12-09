import { Mesh } from "./mesh.mjs";

/** @type {WebGLRenderingContext} */
export var gl;

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

function initTextures() {
    

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

export function loadTexture(path) {
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
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//Initialize everything for starting up a simple webGL application
async function initWebGL() {

    var gl = initGLScene();
    // Drawing ints not shorts. CREDIT: https://computergraphics.stackexchange.com/questions/3637/how-to-use-32-bit-integers-for-element-indices-in-webgl-1-0
    var _ = gl.getExtension("OES_element_index_uint");

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // Back face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    console.log("WebGL Initialized");
}

/**
 * Draws meshes
 * 
 * @param {Array<Mesh>} meshes 
 */
export function drawScene(meshes) {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    meshes.forEach(x => x.draw(gl));
}

export default initWebGL;