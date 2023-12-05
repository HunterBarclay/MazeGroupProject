class MeshHandler {

    /**
     * Load mesh data
     * 
     * @param {Float32Array} vertexArray    Vertex Data
     * @param {Uint32Array} indexArray      Index Data
     * @param {Float32Array} normalArray    Normal Data
     * @param {Float32Array} texCoordArray  Tex Coord Data
     */
    constructor(vertexArray, indexArray, normalArray, texCoordArray) {
        this.vertexArray = typeof vertexArray == Float32Array ? vertexArray : new Float32Array(vertexArray);
        this.indexArray = typeof indexArray == Uint32Array ? indexArray : new Uint32Array(indexArray);
        this.normalArray = typeof normalArray == Float32Array ? normalArray : new Float32Array(normalArray);
        this.texCoordArray = typeof texCoordArray == Float32Array ? texCoordArray : new Float32Array(texCoordArray);
    }

    /**
     * Get the total byte size of the entire mesh
     * 
     * @returns {Number} Number of bytes
     */
    getByteSize() {
        return this.vertexArray.byteLength + this.normalArray.byteLength + this.texCoordArray.byteLength + this.indexArray.byteLength;
    }
    
}

export const gridSize = 128;

export function magnitudeVector(v) {
    return Math.sqrt(
        v[0] * v[0]
        + v[1] * v[1]
        + v[2] * v[2]
    );
}

export function normalizeVector(v) {
    var mag = magnitudeVector(v);
    if (Math.abs(mag) < 0.000001) {
        return [0.0, 0.0, 0.0];
    }
    return [
        v[0] / mag,
        v[1] / mag,
        v[2] / mag
    ];
}

export function subtractVector(a, b) {
    return [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2]
    ];
}

export function addVector(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ];
}

export function multVector(a, b) {
    return [
        a[0] * b,
        a[1] * b,
        a[2] * b
    ];
}

export function crossProductVector(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

export function dotProductVector(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function makePerpendicular(axis, vec) {
    axis = normalizeVector(axis);
    if (Math.abs(dotProductVector(axis, normalizeVector(vec)) - 1.0) < 0.00001) {
        console.error("Way too close:\n" + axis + "\n" + vec);
        return vec;
    }

    var mag = magnitudeVector(vec);
    vec = normalizeVector(vec);
    vec = subtractVector(vec, multVector(axis, dotProductVector(axis, vec)));
    vec = multVector(vec, mag);

    return vec;
}

export function toRadians(a) {
    return a / 180 * Math.PI;
}

function generateNormalsOfTriangle(v1, v2, v3) {
    // CREDIT: https://computergraphics.stackexchange.com/questions/4031/programmatically-generating-vertex-normals
    var normal = normalizeVector(crossProductVector(subtractVector(v2, v1), subtractVector(v3, v1)));
    return [
        normal, normal, normal
    ];
}

function generateNormals(vertices, indices) {
    var normals = new Array(vertices.length);

    for (var i = 0; i < indices.length; i += 3) {
        var [norm1, norm2, norm3] = generateNormalsOfTriangle(
            [vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], vertices[indices[i] * 3 + 2]],
            [vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], vertices[indices[i + 1] * 3 + 2]],
            [vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], vertices[indices[i + 2] * 3 + 2]],
        );
        normals[indices[i] * 3] = norm1[0];
        normals[indices[i] * 3 + 1] = norm1[1];
        normals[indices[i] * 3 + 2] = norm1[2];
        normals[indices[i + 1] * 3] = norm2[0];
        normals[indices[i + 1] * 3 + 1] = norm2[1];
        normals[indices[i + 1] * 3 + 2] = norm2[2];
        normals[indices[i + 2] * 3] = norm3[0];
        normals[indices[i + 2] * 3 + 1] = norm3[1];
        normals[indices[i + 2] * 3 + 2] = norm3[2];
    }

    return normals;
}

function mapVert(x) { return (2.0 / gridSize) * x - 1; }
function mapVert2(x, y) { return [mapVert(x), mapVert(y)]; }
function mapTexCoord(x) { return (mapVert(x) + 1.0) / 2.0; }

function generateHeightMap(s, t) {
    return Math.sin((s + t) * 30) * 0.05;
}

export function generateGridMesh(useHeightMap = false, heightMapFunc = generateHeightMap) {
    var vertices = [];
    var indices = [];
    var texCoords = [];
    var normals = [];

    const test = generateNormalsOfTriangle(
        [0, 0, 0],
        [0, 0, 1],
        [2, 0, 0]
    );

    var y1 = 0.0; // Top Left
    var y2 = 0.0; // Top Right
    var y3 = 0.0; // Bottom Left
    var y4 = 0.0; // Bottom Right

    var heightMap = heightMapFunc();

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {

            if (useHeightMap) {
                y1 = heightMapFunc(mapTexCoord(x),     mapTexCoord(z)    );
                y2 = heightMapFunc(mapTexCoord(x + 1), mapTexCoord(z)    );
                y3 = heightMapFunc(mapTexCoord(x),     mapTexCoord(z + 1));
                y4 = heightMapFunc(mapTexCoord(x + 1), mapTexCoord(z + 1));
            } else {
                y1 = 0.0;
                y2 = 0.0;
                y3 = 0.0;
                y4 = 0.0;
            }

            vertices.push(
                // Top Left
                mapVert(x), y1, mapVert(z),
                mapVert(x), y3, mapVert(z + 1),
                mapVert(x + 1), y2, mapVert(z),

                // Bottom Right
                mapVert(x), y3, mapVert(z + 1),
                mapVert(x + 1), y4, mapVert(z + 1),
                mapVert(x + 1), y2, mapVert(z)
            );

            var indiceOffset = (x * gridSize + z) * 6;
            indices.push(
                indiceOffset, indiceOffset + 1, indiceOffset + 2,
                indiceOffset + 3, indiceOffset + 4, indiceOffset + 5
            );

            texCoords.push(
                // Top Left
                mapTexCoord(x), mapTexCoord(z),
                mapTexCoord(x), mapTexCoord(z + 1),
                mapTexCoord(x + 1), mapTexCoord(z),

                // Bottom Right
                mapTexCoord(x), mapTexCoord(z + 1),
                mapTexCoord(x + 1), mapTexCoord(z + 1),
                mapTexCoord(x + 1), mapTexCoord(z)
            );
        }
    }

    normals = generateNormals(vertices, indices);

    return new MeshHandler(vertices, indices, normals, texCoords);
}

export function generateCubeMesh() {
    var vertices = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    var indices = [
        0, 1, 2, 0, 2, 3,    // Front face
        4, 5, 6, 4, 6, 7,    // Back face
        8, 9, 10, 8, 10, 11,  // Top face
        12, 13, 14, 12, 14, 15, // Bottom face
        16, 17, 18, 16, 18, 19, // Right face
        20, 21, 22, 20, 22, 23  // Left face
    ];

    var texCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    var normals = generateNormals(vertices, indices);

    return new MeshHandler(vertices, indices, normals, texCoords);
}

export default MeshHandler;
