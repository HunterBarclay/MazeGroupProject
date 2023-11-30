attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uDirLight;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vAmbient;

uniform sampler2D uSampler;
// uniform sampler2D uNormalMap;

void main(void) {
    vec3 pos = aVertexPosition;
    // CREDIT: https://stackoverflow.com/questions/42747784/how-to-convert-world-space-transform-to-object-space-transform
    gl_Position = uPMatrix * uVMatrix * uMVMatrix * vec4(pos, 1.0);

    vTextureCoord = aTextureCoord;
    vAmbient = vec3(0.5, 0.5, 0.5);

    mat4 rotMat = uMVMatrix;
    rotMat[3][0] = 0.0;
    rotMat[3][1] = 0.0;
    rotMat[3][2] = 0.0;
    rotMat[0][3] = 0.0;
    rotMat[1][3] = 0.0;
    rotMat[2][3] = 0.0;

    vNormal = (rotMat * vec4(aVertexNormal, 1.0)).xyz;
    // vNormal = aVertexNormal;
}