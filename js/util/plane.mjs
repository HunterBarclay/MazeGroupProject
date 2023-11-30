import { dotProductVector, normalizeVector, subtractVector } from "../renderer/mesh-handler.mjs";

class Plane {
    constructor(point, normal) {
        this.point = [...point];
        this.normal = normalizeVector([...normal]);
        this.d = this.normal[0] * this.point[0] + this.normal[1] * this.point[1] + this.normal[2] * this.point[2]; 
    }

    printEquation() {
        var d = this.normal[0] * this.point[0] + this.normal[1] * this.point[1] + this.normal[2] * this.point[2];
        console.log("(" + this.normal[0] + ")x+(" + this.normal[1] + ")y+(" + this.normal[2] + ")z=" + d);
    }

    dotProduct(testPoint) {
        var p = subtractVector(testPoint, this.point);
        return dotProductVector(this.normal, p);
    }
}

export default Plane;