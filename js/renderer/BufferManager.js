/**
 * 
 * Class for managing Buffers
 */
class BufferManager {
    constructor(gl) {
        this.gl = gl;
        this.batchBuffers = []; 
  
    }

    createBatchBuffer(meshHandler) {
        const batchBuffer = {
            vertexBuffer: this.gl.createBuffer(),
            indexBuffer: this.gl.createBuffer(),
            normalBuffer: this.gl.createBuffer(),
            texCoordBuffer: this.gl.createBuffer(),
            meshHandler: meshHandler 
        };
        this.batchBuffers.push(batchBuffer); 
        return batchBuffer; 
    }

    bindVertexBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.vertexBuffer);
    }

    bindIndexBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);
    }

    bindNormalBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.normalBuffer);
    }
    bindTexCoordBuffer(buffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.texCoordBuffer);
    }

    deleteBatchBuffer(buffer) {
        this.gl.deleteBuffer(buffer.vertexBuffer);
        this.gl.deleteBuffer(buffer.indexBuffer);
        this.gl.deleteBuffer(buffer.normalBuffer);
        this.gl.deleteBuffer(buffer.texCoordBuffer);
        const index = this.batchBuffers.indexOf(buffer);
        if (index !== -1) {
            this.batchBuffers.splice(index, 1);
        }
    }


}