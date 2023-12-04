import MeshHandler from "./mesh-handler.mjs";

/**
 * Handle mesh handlers with associated WebGLBuffers
 */
export class Geometry {

    /** @type {WebGLBuffer} */
    positionBuffer;
    /** @type {WebGLBuffer} */
    normalBuffer;
    /** @type {WebGLBuffer} */
    textureCoordBuffer;
    /** @type {WebGLBuffer} */
    indexBuffer;

    /**
     * Constructs a new Geometry object
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     */
    constructor(gl) {
        this.positionBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.textureCoordBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }

    /**
     * Draws the index buffer with provided other buffers
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     * 
     * @abstract
     */
    draw(gl) {
        console.error("Must be overriden");
    }
    
}
