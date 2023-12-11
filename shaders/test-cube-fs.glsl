// precision mediump float;
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vTangent;
varying float vNormTheta;
varying vec3 vFragPos;
varying vec3 vFragPosWorld;

uniform mat4 uMVMatrix;

uniform sampler2D uSampler;
uniform sampler2D uNormal;
uniform sampler2D uAmbientMap;
uniform sampler2D uRoughness;
uniform vec3 uDirLight;
uniform vec2 uTextureScale;
uniform float uSpecularIntensity;
uniform float uDiffuseIntensity;
uniform vec3 uAmbientLightColor;
uniform float uFogRadius;
uniform float uFogFalloff;
uniform float uDebugMode;

uniform vec3 uPointLightPosition;
uniform float uPointLightIntensity;

float calculateDiffuseLight(vec3 lightDir, vec3 normal) {
    return uDiffuseIntensity * max(dot(normal, -lightDir), 0.0);
}

float calculateSpecularLight(float shininess, vec3 lightDir, vec3 normal) {
    vec3 viewDir = normalize(vFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    return uSpecularIntensity * pow(max(dot(viewDir, reflectDir), 0.0), shininess);
}

void main(void) {

    vec2 texScale = uTextureScale;
    vec2 texCoord = vec2(vTextureCoord.x * texScale.x, vTextureCoord.y * texScale.y);

    vec3 col = texture2D(uSampler, vec2(texCoord.s, texCoord.t)).rgb;
    float ambientOcc = length(texture2D(uAmbientMap, vec2(texCoord.s, texCoord.t)).rgb) / sqrt(3.0);

    vec3 textNorm = texture2D(uNormal, vec2(texCoord.s, texCoord.t)).rgb;
    vec3 normalData = (textNorm - 0.5) * 2.0;
    vec3 biTangent = cross(vNormal, vTangent);
    vec3 normal = (vTangent * normalData.x) + (biTangent * normalData.y) + (vNormal * normalData.z);

    // CREDIT: http://www.c-jump.com/bcc/common/Talk3/OpenGL/Wk06_light/Wk06_light.html and https://learnopengl.com/Lighting/Basic-Lighting
    float shininess = 1.0 - length(texture2D(uRoughness, vec2(texCoord.s, texCoord.t)).rgb) / sqrt(3.0);
    float specularDirect = calculateSpecularLight(shininess, uDirLight, normal);

    col *= ambientOcc;

    float diffuseDirect = calculateDiffuseLight(uDirLight, normal);
    gl_FragColor = vec4(col * diffuseDirect + col * uAmbientLightColor + col * specularDirect, 1.0);
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 pointDir = vFragPosWorld - uPointLightPosition;
    vec3 pointCol = vec3(1.0, 0.7, 0.2);
    float pointRadius = 5.0;
    float pointIntensity = max(uPointLightIntensity * (pointRadius - length(pointDir)), 0.0) / pointRadius;
    pointIntensity = pow(pointIntensity, 2.0);

    float diffusePoint = calculateDiffuseLight(normalize(pointDir), normal);
    float specularPoint = calculateSpecularLight(shininess, normalize(pointDir), normal);
    pointCol *= diffusePoint + specularPoint;

    if (abs(uDebugMode - 3.0) < 0.001) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

    gl_FragColor += vec4((col * pointCol) * pointIntensity, 0.0);

    // TEST COLORS
    // gl_FragColor = vec4(shininess, shininess, shininess, 1.0);
    // gl_FragColor = vec4(ambientOcc, ambientOcc, ambientOcc, 1.0);
    if (abs(uDebugMode - 2.0) < 0.001) {
        gl_FragColor = vec4(normal / 2.0 + 0.5, 1.0);
    }
    // gl_FragColor = vec4(vTextureCoord, 0.0, 1.0);
    // gl_FragColor = vec4(biTangent, 1.0);
    // gl_FragColor = vec4(vNormTheta / 3.14159, vNormTheta / 3.14159, vNormTheta / 3.14159, 1.0);

    float depth = min(1.0, max(0.0, length(vFragPos) / uFogRadius));
    if (abs(uDebugMode - 1.0) < 0.001) {
        float styleDepth = pow(1.0 - depth, 5.0);
        gl_FragColor = vec4(styleDepth, styleDepth, styleDepth, 1.0);
    }

    float fogX = (depth - uFogFalloff) * (1.0 / (1.0 - uFogFalloff));

    // If Fog Radius is less than 1.0, fog effect will be disabled
    gl_FragColor.a = 1.0 - step(1.0, uFogRadius) * (step(uFogFalloff, depth) * fogX);
    gl_FragColor.rgb *= gl_FragColor.a;
}