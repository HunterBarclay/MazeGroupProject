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

    createBatchBuffer(meshHandler, vertexBufferSize, indexBufferSize, normalBufferSize, texCoordBufferSize) {
        this.batchBuffer.meshHandler = meshHandler;
        
        this.batchBuffer.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexBufferSize), this.gl.STATIC_DRAW);
        
        this.batchBuffer.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.batchBuffer.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexBufferSize), this.gl.STATIC_DRAW);
        
        this.batchBuffer.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normalBufferSize), this.gl.STATIC_DRAW);
        
        this.batchBuffer.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.batchBuffer.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoordBufferSize), this.gl.STATIC_DRAW);
        
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
