// precision mediump float;
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vAmbient;
varying float vHeight;

uniform mat4 uMVMatrix;

uniform sampler2D uSampler;
uniform vec3 uDirLight;

void main(void) {

    // vec3 col = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgb;
    vec3 col = vec3(0.2, vHeight * 2.0 - 1.2, 0.2);

    // vec3 normal = 2.0 * texture2D(uNormalMap, vec2(vTextureCoord.s, vTextureCoord.t)).rgb - 1.0;
    vec3 normal = vNormal;
    if (!gl_FrontFacing) {
        normal = -vNormal;
    }

    float diffuse = max(dot(normal, -uDirLight), 0.0);
    gl_FragColor = vec4(col * diffuse + col * vAmbient, 1.0);

    // DEBUG NORMALS
    // gl_FragColor = vec4((normal + 1.0) / 2.0, 1.0);
}