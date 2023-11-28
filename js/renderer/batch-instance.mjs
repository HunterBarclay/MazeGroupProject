import MeshHandler from "./mesh-handler.mjs";

class BatchInstance {
    constructor(meshData, position) { }

    /**
     * Returns the length of data that will be appended to Vertex Buffer 
     */
    getVertexBufferLength() { }

    /**
     * Returns the length of data that will be appended to Index Buffer 
     */
    getIndexBufferLength() { }

    /**
     * Returns the length of data that will be appended to Normal Buffer 
     */
    getNormalBufferLength() { }

    /**
     * Returns the length of data that will be appended to TexCoord Buffer 
     */
    getTexCoordBufferLength() { }

    /**
     * Writes a mesh with batched parameters into buffers for rendering
     * 
     * @param {WebGLBuffer} vertexOffset    Offset from the start of the vertex buffer to start writing
     * @param {WebGLBuffer} vertexBuffer    Vertex Buffer
     * @param {WebGLBuffer} indexOffset     Offset from the start of the index buffer to start writing
     * @param {WebGLBuffer} indexBuffer     Index Buffer
     * @param {WebGLBuffer} normalOffset    Offset from the start of the normal buffer to start writing
     * @param {WebGLBuffer} normalBuffer    Normal Buffer
     * @param {WebGLBuffer} texCoordOffset  Offset from the start of the texture coordinate buffer to start writing
     * @param {WebGLBuffer} texCoordBuffer  Texture coordinate Buffer
     * 
     * Returns an array of the following makeup:
     * [
     *      end index of the vertex buffer,
     *      end index of the index buffer,
     *      end index of the normal buffer,
     *      end index of the texCoord buffer
     * ]
     * 
     * end index means that if we start at index 0, and there are 30 items written to the vertex buffer,
     * the end index will be 30 (one after the last element)
     */
    writeInstanceToBuffer(
        vertexOffset,
        vertexBuffer,
        indexOffset,
        indexBuffer,
        normalOffset,
        normalBuffer,
        texCoordOffset,
        texCoordBuffer,
    ) { }
}

export default BatchInstance;