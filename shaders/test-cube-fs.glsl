// precision mediump float;
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vAmbient;

uniform mat4 uMVMatrix;

uniform sampler2D uSampler;
uniform vec3 uDirLight;

void main(void) {

    vec3 col = vec3(0.2, 0.2, 0.2);

    vec3 normal = vNormal;
    if (!gl_FrontFacing) {
        normal = -vNormal;
    }

    float diffuse = max(dot(normal, -uDirLight), 0.0);
    gl_FragColor = vec4(col * diffuse + col * vAmbient, 1.0);

    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}