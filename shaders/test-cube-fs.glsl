// precision mediump float;
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vAmbient;
varying float vNormTheta;

uniform mat4 uMVMatrix;

uniform sampler2D uSampler;
uniform vec3 uDirLight;

void main(void) {

    vec3 col = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgb;

    vec3 normalData = (col - 0.5) * 2.0;
    vec3 biTangent = cross(vNormal, vTangent);

    vec3 normal = (vTangent * normalData.x) + (biTangent * normalData.y) + (vNormal * normalData.z);

    col = vec3(0.4, 0.4, 0.4);

    if (!gl_FrontFacing) {
        normal = -vNormal;
    }

    float diffuse = max(dot(normal, -uDirLight), 0.0);
    gl_FragColor = vec4(col * diffuse + col * vAmbient, 1.0);
    // gl_FragColor = vec4(normal / 2.0 + 0.5, 1.0);
    // gl_FragColor = vec4(biTangent, 1.0);
    // gl_FragColor = vec4(vNormTheta / 3.14159, vNormTheta / 3.14159, vNormTheta / 3.14159, 1.0);

    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}