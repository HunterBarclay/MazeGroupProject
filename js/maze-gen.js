class MazeNode {
    constructor(id, val = 0) {
        this.id = id;
        this.val = val;
        this.neighbors = [];
    }

    addNeighbor(id) {
        this.neighbors.push(id);
    }
}

class MazeGraph {
    constructor() {
        this.nodes = new Map();
    }

    addNode(node) {
        this.nodes.set(node.id, node);
    }

    makeEdge(idA, idB) {
        var a = this.nodes.get(idA);
        a.addNeighbor(idB);
        var b = this.nodes.get(idB);
        b.addNeighbor(idA);
    }

    getNeighbors(nodeId) {
        return this.nodes.get(nodeId).neighbors;
    }

    hasNode(nodeId) {
        return this.nodes.has(nodeId);
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    print(width, height) {
        var str = "";
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var id = makeId([x, y]);
                if (this.nodes.has(id)) {
                    str += String(this.getNode(id).val) + ",";
                } else {
                    str += "_,";
                }
            }
            str += "\n";
        }

        console.log(str);
    }
}

function makeId(coord) {
    return coord.join(',');
}

function constructCompleteGraph(width, height) {
    var graph = new MazeGraph();
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            graph.addNode(new MazeNode(makeId([x, y])));
        }
    }

    // horizontal connections
    for (var x = 0; x < width - 1; x++) {
        for (var y = 0; y < height; y++) {
            graph.makeEdge(makeId([x, y]), makeId([x + 1, y]));
        }
    }

    // vertical connections
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height - 1; y++) {
            graph.makeEdge(makeId([x, y]), makeId([x, y + 1]));
        }
    }

    return graph;
}

function generateMaze(width, height) {
    var completeGraph = constructCompleteGraph(width, height);
    var mazeGraph = new MazeGraph();

    var blackCounter = 0;

    function recurseBuild(currentId, length) {
        var openNodes = completeGraph.getNeighbors(currentId).filter((nodeId) => !mazeGraph.hasNode(nodeId));
        
        while (openNodes.length > 0) {
            var rand = Math.floor(Math.random() * 100) % openNodes.length;
            console.log(rand);
            var nextId = openNodes[rand];
            mazeGraph.addNode(new MazeNode(nextId, length + 1));
            mazeGraph.makeEdge(currentId, nextId);

            recurseBuild(nextId, length + 1);
            openNodes = completeGraph.getNeighbors(currentId).filter((nodeId) => !mazeGraph.hasNode(nodeId));
        }

        blackCounter++;
    }

    var startId = makeId([Math.floor(width / 4), Math.floor(height / 4)]);
    mazeGraph.addNode(new MazeNode(startId));
    recurseBuild(startId, 0);

    mazeGraph.print(width, height);

    return mazeGraph;
}

generateMaze(20, 20);
