import { addVector, crossProductVector, multVector, subtractVector } from "../renderer/mesh-handler.mjs";
import { mat4 } from "../util/glMatrix_util.mjs";
import Plane from "../util/plane.mjs";

class Camera {
    constructor(nearZ, farZ, fovY, aspect) {
        this.transformation = mat4.create();
        this.projection = mat4.perspective(fovY, aspect, nearZ, farZ);

        this.nearZ = nearZ;
        this.farZ = farZ;
        this.fovY = fovY;

        this.setAspectRatio(aspect);
        this.setPosition([0.0, 0.0, 0.0]);
        this.setRotation([0.0, 0.0, 0.0]);
        this.clean();
    }

    clean() {
        if (this.isDirty) {
            this.genTransformation();
            this.genFrustumPlanes();
            this.genProjection();
            this.isDirty = false;
        }
    }

    setAspectRatio(aspect) {
        this.aspect = aspect;
        this.isDirty = true;
    }

    setPosition(pos) {
        this.position = pos;
        this.isDirty = true;
    }

    setRotation(rot) {
        this.rotation = rot;
        var rotMat = mat4.create();
        rotMat = mat4.identity(rotMat);
        // WHY WHY WHAT IN THE WHY DOES THIS FUCKING WORK
        // This SHOULD be z, x, then y, but for some reason it has to be done in reverse. HASFJDSHJFKDSA
        mat4.rotateY(rotMat, this.rotation[1] / 180.0 * 3.1415);
        mat4.rotateX(rotMat, this.rotation[0] / 180.0 * 3.1415);
        mat4.rotateZ(rotMat, this.rotation[2] / 180.0 * 3.1415);
        this.forward = mat4.multiplyVec3(rotMat, [0.0, 0.0, -1.0]);
        this.right = mat4.multiplyVec3(rotMat, [1.0, 0.0, 0.0]);
        this.up = mat4.multiplyVec3(rotMat, [0.0, 1.0, 0.0]);
        this.isDirty = true;
    }

    getTransformation() {
        this.clean();
        return this.transformation;
    }

    getProjection() {
        this.clean();
        return this.projection;
    }

    /**
     * @returns {Array<Plane>} Planes of the frustum:
     * [ near, far, left, right, top, bottom ]
     */
    getFrustumPlanes() {
        this.clean();
        return this.frustumPlanes;
    }

    genTransformation() {
        this.transformation = mat4.lookAt(this.position, addVector(this.position, this.forward), this.up);
    }

    genProjection() {
        this.projection = mat4.perspective(this.fovY, this.aspect, this.nearZ, this.farZ);
        // this.projection = mat4.inverse(this.projection);
    }

    genFrustumPlanes() {
        const halfVSide = this.farZ * Math.tan((this.fovY / 180.0 * 3.1415) / 2.0);
        const halfHSide = halfVSide * this.aspect;
        const frontMultFar = multVector(this.forward, this.farZ);

        this.frustumPlanes = [
            new Plane( // Near
                addVector(this.position, multVector(this.forward, this.nearZ)),
                this.forward
            ),
            new Plane( // Far
                addVector(this.position, frontMultFar),
                multVector(this.forward, -1.0)
            ),
            new Plane( // Left
                this.position,
                crossProductVector(
                    this.up,
                    addVector(frontMultFar, multVector(this.right, halfHSide))
                )
            ),
            new Plane( // Right
                this.position,
                crossProductVector(
                    addVector(frontMultFar, multVector(this.right, -halfHSide)),
                    this.up
                )
            ),
            new Plane( // Top
                this.position,
                crossProductVector(
                    this.right,
                    addVector(frontMultFar, multVector(this.up, -halfVSide))
                )
            ),
            new Plane( // Bottom
                this.position,
                crossProductVector(
                    addVector(frontMultFar, multVector(this.up, halfVSide)),
                    this.right
                )
            )
        ]
    }
}

export function testCamera() {
    var cam = new Camera(1, 10, 45, 16.0 / 9.0);
    cam.setRotation([-30.0, 0.0, 0.0]);
    var frustrum = cam.getFrustumPlanes();
    for (var plane of frustrum) {
        plane.print();
    }
}

export default Camera;