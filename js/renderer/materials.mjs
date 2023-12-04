import { mat4 } from "../util/glMatrix_util.js";
import Camera from "../components/camera.mjs";
import { normalizeVector } from "./mesh-handler.mjs";

/**
 * Compiles a shader from a given remote source.
 * 
 * @param {WebGLRenderingContext} gl Rendering Context
 * @param {number} type Same parameter for glCreateShader.
 * @param {String} src Get location for glsl file.
 * @returns {WebGLShader} resulting shader.
 */
async function getShader(gl, type, src) {
    var str = await fetch(src, {cache: "no-store"}).then(x => x.text());

    var shader = gl.createShader(type);
    console.log(str);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

/**
 * Compile and link shader program from vertex and fragment shaders.
 * 
 * @param {WebGLRenderingContext} gl Rendering Context
 * @param {String} vertSrc Get location for vertex shader glsl file.
 * @param {String} fragSrc Get location for fragment shader glsl file.
 */
export async function getShaderProgram(gl, vertSrc, fragSrc) {
    var vertexShader = await getShader(gl, gl.VERTEX_SHADER, vertSrc);
    var fragmentShader = await getShader(gl, gl.FRAGMENT_SHADER, fragSrc);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    return shaderProgram;
}

class Material {
    
    /**
     * Constructs a new material with a given shader program.
     * 
     * @param {WebGLProgram} shaderProgram 
     */
    constructor(shaderProgram) {
        this.shaderProgram = shaderProgram;
    }

    /**
     * Enables use of this material's shader program.
     * 
     * @param {WebGLRenderingContext} gl 
     */
    useShaderProgram(gl) {
        gl.useProgram(this.shaderProgram);
    }

    /**
     * Loads uniform parameters into shader program.
     * 
     * @param {WebGLRenderingContext} gl Rendering Context
     * 
     * @abstract
     */
    loadUniforms(gl) { console.error("Must be overriden"); }

    /**
     * Binds buffers and their corresponding pointers
     * 
     * @param {WebGLRenderbuffer} gl Rendering Context
     * @param {Object} buffers Object containing buffers. Dependendant on implementation
     * 
     * @abstract
     */
    bindVertexPointers(gl) { console.error("Must be overriden"); }
}

export class TestCubeMaterial extends Material {

    directionalLight;

    textureScale;
    specularIntensity;
    diffuseIntensity;
    ambientLightColor;

    camera;
    mvMatrix;

    baseTexture;
    normalTexture;
    ambientOcclusionTexture;
    roughnessTexture;

    constructor(gl, shaderProgram) {

        super(shaderProgram);

        this.useShaderProgram(gl);

        this.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.vMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uVMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.baseTextureUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.normalTextureUniform = gl.getUniformLocation(this.shaderProgram, "uNormal");
        this.ambientOcclusionTextureUniform = gl.getUniformLocation(this.shaderProgram, "uAmbientMap");
        this.roughnessTextureUniform = gl.getUniformLocation(this.shaderProgram, "uRoughness");

        this.dirLightUniform = gl.getUniformLocation(this.shaderProgram, "uDirLight");
        this.textureScaleUniform = gl.getUniformLocation(this.shaderProgram, "uTextureScale");
        this.specularIntensityUniform = gl.getUniformLocation(this.shaderProgram, "uSpecularIntensity");
        this.diffuseIntensityUniform = gl.getUniformLocation(this.shaderProgram, "uDiffuseIntensity");
        this.ambientLightColorUniform = gl.getUniformLocation(this.shaderProgram, "uAmbientLightColor");

        this.positionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        if (this.positionAttribute == -1) {
            console.error("Can't find position attr");
        }
        gl.enableVertexAttribArray(this.positionAttribute);

        this.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
        if (this.textureCoordAttribute == -1) {
            console.error("Can't find texCoord attr");
        }
        gl.enableVertexAttribArray(this.textureCoordAttribute);

        this.normalAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexNormal");
        if (this.normalAttribute == -1) {
            console.error("Can't find normal attr");
        }
        gl.enableVertexAttribArray(this.normalAttribute);

        this.baseTexture = null;
        this.normalTexture = null;
        this.ambientOcclusionTexture = null;
        this.roughnessTexture = null;

        this.directionalLight = [0.0, -1.0, 0.0];
        this.textureScale = [1.0, 1.0];
        this.specularIntensity = 0.1;
        this.diffuseIntensity = 1.0;
        this.ambientLightColor = [0.7, 0.7, 0.7];
        
        this.camera = new Camera(0.1, 10, 45, 16.0 / 9.0);
        this.mvMatrix = mat4.identity(mat4.create());
    }

    loadUniforms(gl) {
        // Lighting
        gl.uniform1f(this.specularIntensityUniform, this.specularIntensity);
        gl.uniform1f(this.diffuseIntensityUniform, this.diffuseIntensity);
        gl.uniform3fv(this.ambientLightColorUniform, this.ambientLightColor);
        gl.uniform3fv(this.dirLightUniform, normalizeVector(this.directionalLight));

        // Transformations
        gl.uniformMatrix4fv(this.pMatrixUniform, false, this.camera.getProjection());
        gl.uniformMatrix4fv(this.mvMatrixUniform, false, this.mvMatrix);
        gl.uniformMatrix4fv(this.vMatrixUniform, false, this.camera.getTransformation());

        // Textures
        gl.uniform2fv(this.textureScaleUniform, this.textureScale);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.baseTexture);
        gl.uniform1i(this.baseTextureUniform, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.uniform1i(this.normalTextureUniform, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.ambientOcclusionTexture);
        gl.uniform1i(this.ambientOcclusionTextureUniform, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.roughnessTexture);
        gl.uniform1i(this.roughnessTextureUniform, 3);
    }

    /**
     * Binds buffers and their corresponding pointers
     * 
     * @param {WebGLRenderbuffer} gl Rendering Context
     * @param {Object} buffers Object containing buffers. Following makeup:
     * {
     *  positionBuffer: WebGLBuffer,
     *  normalBuffer: WebGLBuffer,
     *  textureCoordBuffer: WebGLBuffer,
     *  indexBuffer, WebGLBuffer
     * }
     * 
     * @abstract
     */
    bindVertexPointers(gl, buffers) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
        gl.vertexAttribPointer(this.positionAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(this.normalAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoordBuffer);
        gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    }
}
