precision highp float;

uniform vec4 uColor;
uniform vec3 uAmbientLightColor;
uniform vec3 uLightDirection;
uniform float uDiffuseIntensity;
uniform float uSpecularIntensity;

uniform vec3 uPointLightPosition;
uniform float uPointLightIntensity;

uniform float uDebugMode;

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec3 vFragPosWorld;

float calculateDiffuseLight(vec3 lightDir, vec3 normal) {
    return uDiffuseIntensity * max(dot(normal, -lightDir), 0.0);
}

float calculateSpecularLight(float shininess, vec3 lightDir, vec3 normal) {
    vec3 viewDir = normalize(vFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    return uSpecularIntensity * pow(max(dot(viewDir, reflectDir), 0.0), shininess);
}

void main(void) {
    float diffuse = uDiffuseIntensity * max(dot(vNormal, -uLightDirection), 0.0);

    vec3 col = uColor.xyz;
    vec3 ambient = uAmbientLightColor.xyz;

    gl_FragColor = vec4(
        col * calculateDiffuseLight(uLightDirection, vNormal)
        + col * calculateSpecularLight(0.6, uLightDirection, vNormal)
        + col * ambient,
        1.0
    );

    if (abs(uDebugMode - 3.0) < 0.001) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec3 pointDir = vFragPosWorld - uPointLightPosition;
    vec3 pointCol = vec3(1.0, 0.7, 0.2);
    float pointRadius = 3.0;
    float pointIntensity = max(uPointLightIntensity * (pointRadius - length(pointDir)), 0.0) / pointRadius;
    pointIntensity = pow(pointIntensity, 4.0);

    float diffusePoint = calculateDiffuseLight(normalize(pointDir), vNormal);
    float specularPoint = calculateSpecularLight(0.6, normalize(pointDir), vNormal);
    pointCol *= diffusePoint + specularPoint;

    gl_FragColor += vec4((col * pointCol) * pointIntensity, 0.0);

    if (abs(uDebugMode - 1.0) < 0.001) {
        gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Not supported
    } else if (abs(uDebugMode - 2.0) < 0.001) {
        gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
    }
}