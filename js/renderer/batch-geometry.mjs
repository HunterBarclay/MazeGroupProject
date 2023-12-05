import BatchInstance from "./batch-instance.mjs";
import { Geometry } from "./geometry.mjs";
import MeshHandler from "./mesh-handler.mjs";
import { setBatchesDrawn, setMeshesDrawn } from "./renderer.mjs";

/**
 * Class for managing Buffers
 */
class BatchGeometry extends Geometry {

    /** @type {Array<BatchInstance>} */
    batchInstances;
    /** @type {Number} */
    batchSize;
    
    /**
     * Constructs a new BufferManager 
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {MeshHandler} meshHandler Mesh handler for data of each batch instance
     * @param {Number} batchSize Maximum number of batch instances that be can loaded in a single draw call
     */
    constructor(gl, meshHandler, batchSize) {
        super(gl);

        this.batchSize = batchSize;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, (meshHandler.vertexArray.length * Float32Array.BYTES_PER_ELEMENT) * batchSize, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, (meshHandler.normalArray.length * Float32Array.BYTES_PER_ELEMENT) * batchSize, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, (meshHandler.texCoordArray.length * Float32Array.BYTES_PER_ELEMENT) * batchSize, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, (meshHandler.indexArray.length * Uint32Array.BYTES_PER_ELEMENT) * batchSize, gl.DYNAMIC_DRAW);
    }

    /**
     * Source(s):
     * https://docs.gl/es2/
     * 
     * @param {WebGLRenderingContext} gl - WebGL Context
     * @param {Number} initialIndex - Index to start loading instances from
     * 
     * @returns {Number} - loadedCount: Number of BatchInstance objects loaded
     */
    loadBatchInstances(gl, initialIndex = 0) {
        const instancesToLoad = Math.min(this.batchSize, this.batchInstances.length - initialIndex);

        let loadedCount = 0;

        let totalVertexOffset = 0;
        let totalIndexOffset = 0;
        let totalNormalOffset = 0;
        let totalTexCoordOffset = 0;

        for (let i = initialIndex; i < initialIndex + instancesToLoad; i++) {
            const batchInstance = this.batchInstances[i];

            if (batchInstance === undefined) {
                console.log("Batch @ index " + i + " is undefined");
            }
            
            batchInstance.writeInstanceToBuffer(
                gl,
                totalVertexOffset, this.positionBuffer,
                totalIndexOffset, this.indexBuffer,
                totalNormalOffset, this.normalBuffer,
                totalTexCoordOffset, this.textureCoordBuffer
            );

            // Increment offsets by the instance's buffer size
            totalVertexOffset += batchInstance.getVertexBufferSize();
            totalIndexOffset += batchInstance.getIndexBufferSize();
            totalNormalOffset += batchInstance.getNormalBufferSize();
            totalTexCoordOffset += batchInstance.getTexCoordBufferSize();

            loadedCount++;
        }

        return loadedCount;
    }

    /**
     * Draws the index buffer with provided other buffers
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     */
    draw(gl) {

        if (this.batchInstances.length === 0) {
            return;
        }

        var drawCalls = 0;

        var totalLoaded = 0;
        do {
            const loaded = this.loadBatchInstances(gl, totalLoaded);
            totalLoaded += loaded;
            gl.drawElements(gl.TRIANGLES, this.batchInstances[0].meshData.indexArray.length * loaded, gl.UNSIGNED_INT, 0);
            drawCalls++;
        } while (totalLoaded < this.batchInstances.length);

        setBatchesDrawn(drawCalls);
        setMeshesDrawn(totalLoaded);
    }

    deleteBuffers() {        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, 0);
        
        this.gl.deleteBuffer(this.batchBuffer.vertexBuffer);
        this.gl.deleteBuffer(this.batchBuffer.indexBuffer);
        this.gl.deleteBuffer(this.batchBuffer.normalBuffer);
        this.gl.deleteBuffer(this.batchBuffer.texCoordBuffer);
        this.batchBuffer.meshHandler = null;
    }
}

export default BatchGeometry;
