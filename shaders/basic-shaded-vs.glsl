attribute vec3 aVertexPosition;
// attribute vec2 aTextureCoord;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec3 vFragPosWorld;

void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

    vFragPos = (uVMatrix * uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
    vFragPosWorld = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;

    mat4 rotMat = uMVMatrix;
    rotMat[3][0] = 0.0;
    rotMat[3][1] = 0.0;
    rotMat[3][2] = 0.0;
    rotMat[0][3] = 0.0;
    rotMat[1][3] = 0.0;
    rotMat[2][3] = 0.0;

    vNormal = normalize((rotMat * vec4(aVertexNormal, 1.0)).xyz);
}