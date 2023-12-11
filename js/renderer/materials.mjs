import { mat4 } from "../util/glMatrix_util.mjs";
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

class ShaderProgram {

    /** @type {WebGLProgram} */
    program;

    constructor(gl, program) {
        this.program = program;

        this.useProgram(gl);

        this.positionAttribute = gl.getAttribLocation(this.program, "aVertexPosition");
        if (this.positionAttribute == -1) {
            console.error("Can't find position attr");
        }
        gl.enableVertexAttribArray(this.positionAttribute);

        this.textureCoordAttribute = gl.getAttribLocation(this.program, "aTextureCoord");
        if (this.textureCoordAttribute != -1) {
            gl.enableVertexAttribArray(this.textureCoordAttribute);
        }

        this.normalAttribute = gl.getAttribLocation(this.program, "aVertexNormal");
        if (this.normalAttribute != -1) {
            gl.enableVertexAttribArray(this.normalAttribute);
        }
    }

    /**
     * Use the program
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     */
    useProgram(gl) {
        gl.useProgram(this.program);
    }

    /**
     * Loads uniforms into shader program
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {Object} unis Object containing all uniform data
     * 
     * @abstract
     */
    loadUniforms(gl, unis) {
        console.error("Must be overriden");
    }

    /**
     * Binds buffers and their corresponding pointers
     * 
     * @param {WebGLRenderbuffer} gl Rendering Context
     * @param {WebGLBuffer} positionBuffer
     * @param {WebGLBuffer} normalBuffer
     * @param {WebGLBuffer} textureCoordBuffer
     * @param {WebGLBuffer} indexBuffer
     */
    bindVertexPointers(gl, positionBuffer, normalBuffer, textureCoordBuffer, indexBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.positionAttribute, 3, gl.FLOAT, false, 0, 0);

        if (this.normalAttribute != -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.vertexAttribPointer(this.normalAttribute, 3, gl.FLOAT, false, 0, 0);
        }

        if (this.textureCoordAttribute != -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
            gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }
}

class FullTextureShaderProgram extends ShaderProgram {
    constructor(gl, program) {
        super(gl, program);

        this.pMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
        this.vMatrixUniform = gl.getUniformLocation(this.program, "uVMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        this.baseTextureUniform = gl.getUniformLocation(this.program, "uSampler");
        this.normalTextureUniform = gl.getUniformLocation(this.program, "uNormal");
        this.ambientOcclusionTextureUniform = gl.getUniformLocation(this.program, "uAmbientMap");
        this.roughnessTextureUniform = gl.getUniformLocation(this.program, "uRoughness");

        this.dirLightUniform = gl.getUniformLocation(this.program, "uDirLight");
        this.pointLightPositionUniform = gl.getUniformLocation(this.program, "uPointLightPosition");
        this.textureScaleUniform = gl.getUniformLocation(this.program, "uTextureScale");
        this.specularIntensityUniform = gl.getUniformLocation(this.program, "uSpecularIntensity");
        this.diffuseIntensityUniform = gl.getUniformLocation(this.program, "uDiffuseIntensity");
        this.pointLightIntensityUniform = gl.getUniformLocation(this.program, "uPointLightIntensity");
        this.ambientLightColorUniform = gl.getUniformLocation(this.program, "uAmbientLightColor");

        this.fogRadiusUniform = gl.getUniformLocation(this.program, "uFogRadius");
        this.fogFalloffUniform = gl.getUniformLocation(this.program, "uFogFalloff");

        this.debugModeUniform = gl.getUniformLocation(this.program, "uDebugMode");
    }

    /**
     * Loads uniforms into shader program
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {Object} unis Object containing all uniform data
     */
    loadUniforms(gl, unis) {

        this.useProgram(gl);

        gl.uniform1f(this.debugModeUniform, unis.debugMode);

        // Lighting
        gl.uniform1f(this.specularIntensityUniform, unis.specularIntensity);
        gl.uniform1f(this.diffuseIntensityUniform, unis.diffuseIntensity);
        gl.uniform3fv(this.ambientLightColorUniform, unis.ambientLightColor);
        gl.uniform3fv(this.dirLightUniform, normalizeVector(unis.directionalLight));
        gl.uniform3fv(this.pointLightPositionUniform, unis.pointLightPosition);
        gl.uniform1f(this.pointLightIntensityUniform, unis.pointLightIntensity);

        gl.uniform1f(this.fogRadiusUniform, Math.max(0.0, Math.min(unis.camera.farZ - unis.camera.nearZ, unis.fogRadius)));
        gl.uniform1f(this.fogFalloffUniform, Math.max(0.0, Math.min(1.0, unis.fogFalloff)));

        // Transformations
        gl.uniformMatrix4fv(this.pMatrixUniform, false, unis.camera.getProjection());
        gl.uniformMatrix4fv(this.mvMatrixUniform, false, unis.mvMatrix);
        gl.uniformMatrix4fv(this.vMatrixUniform, false, unis.camera.getTransformation());

        // Textures
        gl.uniform2fv(this.textureScaleUniform, unis.textureScale);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, unis.baseTexture);
        gl.uniform1i(this.baseTextureUniform, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, unis.normalTexture);
        gl.uniform1i(this.normalTextureUniform, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, unis.ambientOcclusionTexture);
        gl.uniform1i(this.ambientOcclusionTextureUniform, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, unis.roughnessTexture);
        gl.uniform1i(this.roughnessTextureUniform, 3);
    }
}

class BasicEmissionShaderProgram extends ShaderProgram {
    constructor(gl, program) {
        super(gl, program);

        this.pMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
        this.vMatrixUniform = gl.getUniformLocation(this.program, "uVMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        this.colorUniform = gl.getUniformLocation(this.program, "uColor");
    }

    /**
     * Loads uniforms into shader program
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {Object} unis Object containing all uniform data
     */
    loadUniforms(gl, unis) {
        this.useProgram(gl);

        gl.uniformMatrix4fv(this.pMatrixUniform, false, unis.camera.getProjection());
        gl.uniformMatrix4fv(this.mvMatrixUniform, false, unis.mvMatrix);
        gl.uniformMatrix4fv(this.vMatrixUniform, false, unis.camera.getTransformation());
        gl.uniform4fv(this.colorUniform, unis.color);
    }
}

class BasicShadedShaderProgram extends ShaderProgram {
    constructor(gl, program) {
        super(gl, program);

        this.pMatrixUniform = gl.getUniformLocation(this.program, "uPMatrix");
        this.vMatrixUniform = gl.getUniformLocation(this.program, "uVMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        this.colorUniform = gl.getUniformLocation(this.program, "uColor");
        
        this.lightDirectionUniform = gl.getUniformLocation(this.program, "uLightDirection");
        this.diffuseIntensityUniform = gl.getUniformLocation(this.program, "uDiffuseIntensity");
        this.specularIntensityUniform = gl.getUniformLocation(this.program, "uSpecularIntensity");
        this.ambientLightColorUniform = gl.getUniformLocation(this.program, "uAmbientLightColor");
        this.pointLightPositionUniform = gl.getUniformLocation(this.program, "uPointLightPosition");
        this.pointLightIntensityUniform = gl.getUniformLocation(this.program, "uPointLightIntensity");

        this.debugModeUniform = gl.getUniformLocation(this.program, "uDebugMode");
    }

    /**
     * Loads uniforms into shader program
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {Object} unis Object containing all uniform data
     */
    loadUniforms(gl, unis) {
        this.useProgram(gl);

        gl.uniformMatrix4fv(this.pMatrixUniform, false, unis.camera.getProjection());
        gl.uniformMatrix4fv(this.mvMatrixUniform, false, unis.mvMatrix);
        gl.uniformMatrix4fv(this.vMatrixUniform, false, unis.camera.getTransformation());
        gl.uniform4fv(this.colorUniform, unis.color);

        gl.uniform3fv(this.lightDirectionUniform, normalizeVector(unis.lightDirection));
        gl.uniform1f(this.diffuseIntensityUniform, unis.diffuseIntensity);
        gl.uniform1f(this.specularIntensityUniform, unis.specularIntensity);
        gl.uniform3fv(this.ambientLightColorUniform, unis.ambientLightColor);
        gl.uniform3fv(this.pointLightPositionUniform, unis.pointLightPosition);
        gl.uniform1f(this.pointLightIntensityUniform, unis.pointLightIntensity);

        gl.uniform1f(this.debugModeUniform, unis.debugMode);
    }
}

/** @type {FullTextureShaderProgram} */
var fullTextProgram = null;
export async function GetFullTextureShaderProgram(gl) {
    if (fullTextProgram === null) {
        fullTextProgram = new FullTextureShaderProgram(
            gl,
            await getShaderProgram(gl, "./shaders/test-cube-vs.glsl", "./shaders/test-cube-fs.glsl")
        );
    }

    return fullTextProgram;
}

/** @type {BasicEmissionShaderProgram} */
var basicEmisProgram = null;
export async function GetBasicEmissionShaderProgram(gl) {
    if (basicEmisProgram === null) {
        basicEmisProgram = new BasicEmissionShaderProgram(
            gl,
            await getShaderProgram(gl, "./shaders/basic-emission-vs.glsl", "./shaders/basic-emission-fs.glsl")
        );
    }

    return basicEmisProgram;
}

/** @type {BasicShadedShaderProgram} */
var basicShadedProgram = null;
export async function GetBasicShadedShaderProgram(gl) {
    if (basicShadedProgram === null) {
        basicShadedProgram = new BasicShadedShaderProgram(
            gl,
            await getShaderProgram(gl, "./shaders/basic-shaded-vs.glsl", "./shaders/basic-shaded-fs.glsl")
        );
    }

    return basicShadedProgram;
}

export class Material {

    /** @type {ShaderProgram} */
    shaderProgram;
    
    /**
     * Constructs a new material with a given shader program.
     * 
     * @param {ShaderProgram} shaderProgram 
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
        this.shaderProgram.useProgram(gl);
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
     * @param {WebGLBuffer?} positionBuffer
     * @param {WebGLBuffer?} normalBuffer
     * @param {WebGLBuffer?} textureCoordBuffer
     * @param {WebGLBuffer?} indexBuffer
     */
    bindVertexPointers(gl, positionBuffer, normalBuffer, textureCoordBuffer, indexBuffer) {
        this.shaderProgram.bindVertexPointers(gl, positionBuffer, normalBuffer, textureCoordBuffer, indexBuffer);
    }
}

export class TestCubeMaterial extends Material {

    debugMode;

    directionalLight;
    pointLightPosition;

    textureScale;
    specularIntensity;
    diffuseIntensity;
    ambientLightColor;
    pointLightIntensity;

    fogRadius;
    fogFalloff;

    camera;
    mvMatrix;

    baseTexture;
    normalTexture;
    ambientOcclusionTexture;
    roughnessTexture;

    constructor(gl, shaderProgram, camera) {

        super(shaderProgram);

        this.debugMode = 0;

        this.baseTexture = null;
        this.normalTexture = null;
        this.ambientOcclusionTexture = null;
        this.roughnessTexture = null;

        this.directionalLight = [0.0, -1.0, 0.0];
        this.pointLightPosition = [0.0, 0.0, 0.0];
        this.textureScale = [1.0, 1.0];
        this.specularIntensity = 0.1;
        this.diffuseIntensity = 1.0;
        this.pointLightIntensity = 1.0;
        this.ambientLightColor = [0.7, 0.7, 0.7];

        this.fogRadius = 0.0;
        this.fogFalloff = 0.7;
        
        this.camera = camera;
        this.mvMatrix = mat4.identity(mat4.create());
    }

    loadUniforms(gl) {
        this.shaderProgram.loadUniforms(gl, this);
    }
}

export class BasicEmissionMaterial extends Material {

    /** @type {Array<Number>} */
    color;
    /** @type {Array<Number>} */
    mvMatrix;
    /** @type {Camera} */
    camera;

    /**
     * Constructs a new material with a given shader program.
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {ShaderProgram} shaderProgram Shader Program
     * @param {Camera} camera Main Camera
     */
    constructor(gl, shaderProgram, camera) {

        super(shaderProgram);
        
        this.color = [1.0, 1.0, 1.0, 1.0];
        
        this.camera = camera;
        this.mvMatrix = mat4.identity(mat4.create());
    }

    loadUniforms(gl) {
        this.shaderProgram.loadUniforms(gl, this);
    }
}

export class BasicShadedMaterial extends Material {

    /** @type {Array<Number>} */
    color;
    /** @type {Array<Number>} */
    mvMatrix;
    /** @type {Camera} */
    camera;

    /**
     * Constructs a new material with a given shader program.
     * 
     * @param {WebGLRenderingContext} gl WebGL Context
     * @param {ShaderProgram} shaderProgram Shader Program
     * @param {Camera} camera Main Camera
     */
    constructor(gl, shaderProgram, camera) {

        super(shaderProgram);
        
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.lightDirection = [0.0, -1.0, 0.0];
        this.diffuseIntensity = 1.0;
        this.specularIntensity = 0.0;
        this.ambientLightColor = [0.2, 0.2, 0.2, 1.0];
        this.pointLightIntensity = 1.0;
        this.pointLightPosition = [0.0, 0.0, 0.0];
        
        this.camera = camera;
        this.mvMatrix = mat4.identity(mat4.create());

        this.debugMode = 0.0;
    }

    loadUniforms(gl) {
        this.shaderProgram.loadUniforms(gl, this);
    }
}
