import { Geometry } from "./geometry.mjs";
import { Material } from "./materials.mjs";

export class Mesh {
    
    /** @type {Geometry} */
    geometry;
    /** @type {Material} */
    material;

    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
    }

    /**
     * Draws the mesh to the scene
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     */
    draw(gl) {
        this.material.useShaderProgram(gl);
        this.material.loadUniforms(gl);
        this.material.bindVertexPointers(
            gl,
            this.geometry.positionBuffer,
            this.geometry.normalBuffer,
            this.geometry.textureCoordBuffer,
            this.geometry.indexBuffer
        );
        this.geometry.draw(gl);
    }
}