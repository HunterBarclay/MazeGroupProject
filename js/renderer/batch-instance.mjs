import MeshHandler from "./mesh-handler.mjs";

class BatchInstance {

    /**
     * Create a batch instance
     * 
     * @param {MeshHandler} meshData    Mesh handler for data
     * @param {Array<Number>} position  3 floats to describe position
     */
    constructor(meshData, position) {
        this.meshData = meshData;
        this.position = position;
    }

    /**
     * Returns the length of data in bytes that will be appended to Vertex Buffer 
     */
    getVertexBufferSize() {
        return this.meshData.vertexArray.length * Float32Array.BYTES_PER_ELEMENT;
    }

    /**
     * Returns the length of data in bytes that will be appended to Index Buffer 
     */
    getIndexBufferSize() {
        return this.meshData.indexArray.length * Uint32Array.BYTES_PER_ELEMENT;
    }

    /**
     * Returns the length of data in bytes that will be appended to Normal Buffer 
     */
    getNormalBufferSize() {
        return this.meshData.normalArray.length * Float32Array.BYTES_PER_ELEMENT;
    }

    /**
     * Returns the length of data in bytes that will be appended to TexCoord Buffer 
     */
    getTexCoordBufferSize() {
        return this.meshData.texCoordArray.length * Float32Array.BYTES_PER_ELEMENT;
    }

    /**
     * Writes a mesh with batched parameters into buffers for rendering
     * 
     * @param {WebGLRenderingContext} gl    WebGL Context
     * @param {Number} vertexOffset         Offset from the start of the vertex buffer to start writing
     * @param {WebGLBuffer} vertexBuffer    Vertex Buffer
     * @param {Number} indexOffset          Offset from the start of the index buffer to start writing
     * @param {WebGLBuffer} indexBuffer     Index Buffer
     * @param {Number} normalOffset         Offset from the start of the normal buffer to start writing
     * @param {WebGLBuffer} normalBuffer    Normal Buffer
     * @param {Number} texCoordOffset       Offset from the start of the texture coordinate buffer to start writing
     * @param {WebGLBuffer} texCoordBuffer  Texture coordinate Buffer
     * 
     * @returns {Array<Number>} An array of the following makeup:
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
        gl,
        vertexOffset,
        vertexBuffer,
        indexOffset,
        indexBuffer,
        normalOffset,
        normalBuffer,
        texCoordOffset,
        texCoordBuffer
    ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        {
            // The theory is that calling bufferSubData has a lot of overhead, so allocating all the altered data
            // into an array, then loading the array into the buffer is faster. Who knows if thats true.
            var tmpVertBuf = new Float32Array(this.meshData.vertexArray.length);
            for (var i = 0; i < tmpVertBuf.length; i++) {
                tmpVertBuf[i] = this.meshData.vertexArray[i] + this.position[i % 3];
            }
            gl.bufferSubData(gl.ARRAY_BUFFER, vertexOffset, tmpVertBuf);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, indexOffset, this.meshData.indexArray);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, normalOffset, this.meshData.normalArray);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, this.meshData.texCoordArray);

        return [
            vertexOffset + this.getVertexBufferSize(),
            indexOffset + this.getIndexBufferSize(),
            normalOffset + this.getNormalBufferSize(),
            texCoordOffset + this.getTexCoordBufferSize()
        ];
    }
}

export default BatchInstance;