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

function mapVertDefault(x, gridSize) { return (1.0 / (gridSize - 1)) * x  - 0.5 }
function mapVert2(x, y) { return [mapVert(x), mapVert(y)]; }
function mapTexCoordDefault(x, gridSize) { return (mapVertDefault(x) + 1.0) / 2.0; }

function generateHeightMap(s, t) {
    return Math.sin((s + t) * 30) * 0.05;
}

export function generateGridMesh(useHeightMap = false, heightMapFunc = generateHeightMap,
    mapVert = mapVertDefault, mapTexCoord = mapTexCoordDefault, gridSize = 64) {
    var vertices = [];
    var indices = [];
    var texCoords = [];
    var normals = [];

    // if (!useHeightMap) {
    //     heightMapFunc = (_, _) => 0.0;
    // }

    var smoothNormal = (me, front, back, left, right) => {
        var frontNormal = crossProductVector(
            normalizeVector(subtractVector(
                front,
                me
            )),
            [1.0, 0.0, 0.0]
        );
        var backNormal = crossProductVector(
            normalizeVector(subtractVector(
                back,
                me
            )),
            [-1.0, 0.0, 0.0]
        );
        var leftNormal = crossProductVector(
            normalizeVector(subtractVector(
                left,
                me
            )),
            [0.0, 0.0, -1.0]
        );
        var rightNormal = crossProductVector(
            normalizeVector(subtractVector(
                right,
                me
            )),
            [0.0, 0.0, 1.0]
        );

        return normalizeVector(addVector(addVector(addVector(frontNormal, backNormal), leftNormal), rightNormal));
    };

    var getVert = (x, z, gridSize) => {
        return [
            mapVert(x, gridSize),
            heightMapFunc(mapTexCoord(x, gridSize), mapTexCoord(z, gridSize)),
            mapVert(z, gridSize)
        ];
    };

    var getTex = (x, z, gridSize) => {
        return [ mapTexCoord(x, gridSize), mapTexCoord(z, gridSize) ];
    }

    var vert2d = new Array(gridSize + 1);
    var tex2d = new Array(gridSize + 1);
    var norm2d = new Array(gridSize + 1);

    for (var z = 0; z < gridSize + 1; z++) {
        vert2d[z] = new Array(gridSize + 1);
        tex2d[z] = new Array(gridSize + 1);
        for (var x = 0; x < gridSize + 1; x++) {
            vert2d[z][x] = getVert(x, z, gridSize);
            tex2d[z][x] = getTex(x, z, gridSize);
        }
    }

    for (var z = 0; z < gridSize + 1; z++) {
        norm2d[z] = new Array(gridSize + 1);
        for (var x = 0; x < gridSize + 1; x++) {
            norm2d[z][x] = smoothNormal(
                vert2d[z][x],
                z < gridSize ? vert2d[z + 1][x] : vert2d[z][x],
                z > 0 ? vert2d[z - 1][x] : vert2d[z][x],
                x < gridSize ? vert2d[z][x + 1] : vert2d[z][x],
                x > 0 ? vert2d[z][x - 1] : vert2d[z][x]
            );
        }
    }

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {

            vertices.push(
                // Top Left
                vert2d[z][x][0], vert2d[z][x][1], vert2d[z][x][2],
                vert2d[z + 1][x][0], vert2d[z + 1][x][1], vert2d[z + 1][x][2],
                vert2d[z][x + 1][0], vert2d[z][x + 1][1], vert2d[z][x + 1][2],

                // Bottom Right
                vert2d[z + 1][x][0], vert2d[z + 1][x][1], vert2d[z + 1][x][2],
                vert2d[z + 1][x + 1][0], vert2d[z + 1][x + 1][1], vert2d[z + 1][x + 1][2],
                vert2d[z][x + 1][0], vert2d[z][x + 1][1], vert2d[z][x + 1][2]
            );

            var indiceOffset = (x * gridSize + z) * 6;
            indices.push(
                indiceOffset, indiceOffset + 1, indiceOffset + 2,
                indiceOffset + 3, indiceOffset + 4, indiceOffset + 5
            );

            texCoords.push(
                // Top Left
                tex2d[z][x][0], tex2d[z][x][1],
                tex2d[z + 1][x][0], tex2d[z + 1][x][1],
                tex2d[z][x + 1][0], tex2d[z][x + 1][1],

                // Bottom Right
                tex2d[z + 1][x][0], tex2d[z + 1][x][1],
                tex2d[z + 1][x + 1][0], tex2d[z + 1][x + 1][1],
                tex2d[z][x + 1][0], tex2d[z][x + 1][1]
            );

            if (useHeightMap) {
                normals.push(
                    norm2d[z][x][0], norm2d[z][x][1], norm2d[z][x][2],
                    norm2d[z + 1][x][0], norm2d[z + 1][x][1], norm2d[z + 1][x][2],
                    norm2d[z][x + 1][0], norm2d[z][x + 1][1], norm2d[z][x + 1][2],

                    norm2d[z + 1][x][0], norm2d[z + 1][x][1], norm2d[z + 1][x][2],
                    norm2d[z + 1][x + 1][0], norm2d[z + 1][x + 1][1], norm2d[z + 1][x + 1][2],
                    norm2d[z][x + 1][0], norm2d[z][x + 1][1], norm2d[z][x + 1][2]
                );
            }
        }
    }

    if (!useHeightMap) {
        normals = generateNormals(vertices, indices);
    }

    return new MeshHandler(vertices, indices, normals, texCoords);
}

export function generateCubeMesh() {
    var vertices = [
        // Front face
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,

        // Back face
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,

        // Top face
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,

        // Right face
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,

        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
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
