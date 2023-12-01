// precision mediump float;
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vAmbient;
varying float vNormTheta;
varying vec3 vFragPos;

uniform mat4 uMVMatrix;

uniform sampler2D uSampler;
uniform sampler2D uNormal;
uniform sampler2D uAmbientMap;
uniform sampler2D uRoughness;
uniform vec3 uDirLight;

void main(void) {

    vec2 texScale = vec2(3.0, 1.5);
    vec2 texCoord = vec2(vTextureCoord.x * texScale.x, vTextureCoord.y * texScale.y);

    vec3 col = texture2D(uSampler, vec2(texCoord.s, texCoord.t)).rgb;
    float ambientOcc = length(texture2D(uAmbientMap, vec2(texCoord.s, texCoord.t)).rgb) / sqrt(3.0);

    vec3 textNorm = texture2D(uNormal, vec2(texCoord.s, texCoord.t)).rgb;
    vec3 normalData = (textNorm - 0.5) * 2.0;
    vec3 biTangent = cross(vNormal, vTangent);
    vec3 normal = (vTangent * normalData.x) + (biTangent * normalData.y) + (vNormal * normalData.z);

    // CREDIT: http://www.c-jump.com/bcc/common/Talk3/OpenGL/Wk06_light/Wk06_light.html and https://learnopengl.com/Lighting/Basic-Lighting
    // float shininess = 1.0 - length(texture2D(uRoughness, vec2(texCoord.s, texCoord.t)).rgb) / sqrt(3.0);
    float shininess = 0.9;
    vec3 viewDir = normalize(vFragPos);
    vec3 reflectDir = reflect(-uDirLight, normal);
    float specular = shininess * pow(max(dot(viewDir, reflectDir), 0.0), 256.0);

    // if (!gl_FrontFacing) {
    //     normal = -vNormal;
    // }

    col *= ambientOcc;

    float diffuse = max(dot(normal, -uDirLight), 0.0);
    gl_FragColor = vec4(col * diffuse + col * vAmbient + col * specular, 1.0);
    // gl_FragColor = vec4(ambientOcc, ambientOcc, ambientOcc, 1.0);
    // gl_FragColor = vec4(normal / 2.0 + 0.5, 1.0);
    // gl_FragColor = vec4(vTextureCoord, 0.0, 1.0);
    // gl_FragColor = vec4(biTangent, 1.0);
    // gl_FragColor = vec4(vNormTheta / 3.14159, vNormTheta / 3.14159, vNormTheta / 3.14159, 1.0);

    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}