attribute vec3 aVertexPosition;
// attribute vec2 aTextureCoord;
// attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}