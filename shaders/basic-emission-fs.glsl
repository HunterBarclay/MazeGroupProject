precision highp float;

uniform vec4 uColor;

void main(void) {
    // gl_FragColor.a = uColor.a;
    // gl_FragColor.rgb = uColor.rgb * uColor.a;
    gl_FragColor = uColor;
}