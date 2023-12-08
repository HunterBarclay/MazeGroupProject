import { mat4 } from "../util/glMatrix_util.mjs";

class Transform {

    /** @type {[Number, Number, Number]} */
    #_position = [0.0, 0.0, 0.0];
    /** @type {[Number, Number, Number]} */
    #_rotation = [0.0, 0.0, 0.0];
    /** @type {[Number, Number, Number]} */
    #_scale = [1.0, 1.0, 1.0];

    /** @type {Array<Number>} */
    matrix;

    /**
     * Constructs a new transform
     * 
     * @param {[Number, Number, Number]?} position 
     * @param {[Number, Number, Number]?} rotation 
     * @param {[Number, Number, Number]?} scale 
     */
    constructor(position, rotation, scale) {

        this.matrix = mat4.create();

        position && (this.#_position = position);
        rotation && (this.#_rotation = rotation);
        scale && (this.#_scale = scale);

        this.regenMatrix();
    }

    get position() { return this.#_position; }

    set position(pos) {
        this.#_position = pos;

        this.regenMatrix();
    }

    get rotation() { return this.#_rotation; }

    set rotation(rot) {
        this.#_rotation = rot;

        this.regenMatrix();
    }

    get scale() { return this.#_scale; }

    set scale(sca) {
        this.#_scale = sca;

        this.regenMatrix();
    }

    regenMatrix() {

        // This does T(R(S())) but in reverse cuz the matrix math we have is bad

        mat4.identity(this.matrix);

        // Scale
        mat4.scale(this.matrix, this.#_scale);

        // Rotation
        mat4.rotateY(this.matrix, this.#_rotation[1] / 180.0 * 3.1415);
        mat4.rotateX(this.matrix, this.#_rotation[0] / 180.0 * 3.1415);
        mat4.rotateZ(this.matrix, this.#_rotation[2] / 180.0 * 3.1415);

        // Translation
        mat4.translate(this.matrix, this.#_position);
    }
}

export default Transform;