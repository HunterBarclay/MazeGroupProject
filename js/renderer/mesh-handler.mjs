class MeshHandler {

    /**
     * Load mesh data
     * 
     * @param {Float32Array} vertexArray    Vertex Data
     * @param {Float32Array} indexArray     Index Data
     * @param {Float32Array} normalArray    Normal Data
     * @param {Float32Array} texCoordArray  Tex Coord Data
     */
    constructor(vertexArray, indexArray, normalArray, texCoordArray) {
        this.vertexArray = vertexArray;
        this.indexArray = indexArray;
        this.normalArray = normalArray;
        this.texCoordArray = texCoordArray;
    }

    
}

export default MeshHandler;
