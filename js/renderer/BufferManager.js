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


    //Adjusting this to match how we have it currently in initGeometry() - Jordan


    populateVertexBuffer(buffer, data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    populateIndexBuffer(buffer, data) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    populateNormalBuffer(buffer, data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }


    populateTexCoordBuffer(buffer, data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
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