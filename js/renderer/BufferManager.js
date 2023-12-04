/**
 * 
 * Class for managing Buffers
 */
class BufferManager {
    constructor(gl) {
        this.gl = gl;
        this.batchBuffer = {
            vertexBuffer: null,
            indexBuffer: null,
            normalBuffer: null,
            texCoordBuffer: null,
            meshHandler: null,
        };
    }

    createBatchBuffer(meshHandler, numBatchInstances) {
        this.batchBuffer.meshHandler = meshHandler;
        
        this.batchBuffer.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, (this.batchBuffer.meshHandler.vertexArray.length * Float32Array.BYTES_PER_ELEMENT) * numBatchInstances, this.gl.STATIC_DRAW);
        
        this.batchBuffer.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.batchBuffer.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, (this.batchBuffer.meshHandler.indexArray.length * Uint32Array.BYTES_PER_ELEMENT) * numBatchInstances, this.gl.STATIC_DRAW);
        
        this.batchBuffer.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, (this.batchBuffer.meshHandler.normalArray.length * Float32Array.BYTES_PER_ELEMENT) * numBatchInstances, this.gl.STATIC_DRAW);
        
        this.batchBuffer.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, (this.batchBuffer.meshHandler.texCoordArray.length * Float32Array.BYTES_PER_ELEMENT) * numBatchInstances, this.gl.STATIC_DRAW);
        
        return this.batchBuffer;
    }

    populateVertexBuffer(data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    populateIndexBuffer(data) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.batchBuffer.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    populateNormalBuffer(data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    populateTexCoordBuffer(data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    setVertexBufferItemSize(itemSize) {
        this.batchBuffer.vertexBuffer.itemSize = itemSize;
    }

    setIndexBufferItemSize(itemSize) {
        this.batchBuffer.indexBuffer.itemSize = itemSize;
    }

    setNormalBufferItemSize(itemSize) {
        this.batchBuffer.normalBuffer.itemSize = itemSize;
    }

    setTexCoordBufferItemSize(itemSize) {
        this.batchBuffer.texCoordBuffer.itemSize = itemSize;
    }

    getVertexBufferItemSize() {
        return this.batchBuffer.vertexBuffer ? this.batchBuffer.vertexBuffer.itemSize : null;
    }

    getIndexBufferItemSize() {
        return this.batchBuffer.indexBuffer ? this.batchBuffer.indexBuffer.itemSize : null;
    }

    getNormalBufferItemSize() {
        return this.batchBuffer.normalBuffer ? this.batchBuffer.normalBuffer.itemSize : null;
    }

    getTexCoordBufferItemSize() {
        return this.batchBuffer.texCoordBuffer ? this.batchBuffer.texCoordBuffer.itemSize : null;
    }

    getVertexBuffer() {
        return this.batchBuffer.vertexBuffer;
    }

    getIndexBuffer() {
        return this.batchBuffer.indexBuffer;
    }

    getNormalBuffer() {
        return this.batchBuffer.normalBuffer;
    }

    getTexCoordBuffer() {
        return this.batchBuffer.texCoordBuffer;
    }




    deleteBatchBuffer() {        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, 0);
        
        this.gl.deleteBuffer(this.batchBuffer.vertexBuffer);
        this.gl.deleteBuffer(this.batchBuffer.indexBuffer);
        this.gl.deleteBuffer(this.batchBuffer.normalBuffer);
        this.gl.deleteBuffer(this.batchBuffer.texCoordBuffer);
        this.batchBuffer.meshHandler = null;
    }
}

export default BufferManager;
