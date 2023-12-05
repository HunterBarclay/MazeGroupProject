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

export class BasicGeometry extends Geometry {

    /** @type {MeshHandler} */
    meshHandler;

    /**
     * Constructs a new Geometry object
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {MeshHandler} meshHandler Mesh handler for data of each batch instance
     */
    constructor(gl, meshHandler) {
        super(gl);

        this.meshHandler = meshHandler;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, meshHandler.vertexArray, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, meshHandler.normalArray, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, meshHandler.texCoordArray, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshHandler.indexArray, gl.DYNAMIC_DRAW);
    }

    /**
     * Draws the index buffer with provided other buffers
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     */
    draw(gl) {
        gl.drawElements(gl.TRIANGLES, this.meshHandler.indexArray.length, gl.UNSIGNED_INT, 0);
    }
}
