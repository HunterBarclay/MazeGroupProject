/**
 * Maze Generation
 * Author: Hunter Barclay @KyroVibe
 * 
 * The maze generation starts with a grid graph, with each node connected to its vertial and horizontal neighbors.
 * We then construct a second graph that starts with some random node in the former then, of its neighbors not in the new graph,
 * we randomly select one to add to the new graph and create an edge between the start node and the new node. We then recursively
 * do this for the new node, then reevaluate and do this until all neighbors are in the new graph.
 * 
 * We store all leaf nodes of the new graph (except for the start node if it is a leaf node) and sort them in ascending order by
 * distance from the starting node. We then use a difficulty factor to determine how close to the front or back of this list we pick
 * the end point.
 */

// CREDIT: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
var seed = Date.now();
function random() {
    seed++;
    var x = Math.sin(seed) * 1000;
    return x - Math.floor(x);
}

function makeId(position) {
    return position.join(',');
}

export class MazeNode {
    constructor(position, distance) {
        this.position = position;
        this.distance = distance;
        this.neighbors = [];

        this.id = makeId(position);
    }

    addNeighbor(id) {
        this.neighbors.push(id);
    }
}

export class MazeGraph {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.nodes = new Map();
        this.edges = new Array();
    }

    addNode(node) {
        this.nodes.set(node.id, node);
    }

    makeEdge(idA, idB) {
        var a = this.nodes.get(idA);
        a.addNeighbor(idB);
        var b = this.nodes.get(idB);
        b.addNeighbor(idA);

        this.edges.push([idA, idB]);
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
}

function constructCompleteGraph(width, height) {
    var graph = new MazeGraph(width, height);
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            graph.addNode(new MazeNode([x, y]));
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

/**
 * Used for storing maze information
 */
export class Maze {
    constructor(mazeGraph, startPosition, endPosition, difficultyRating) {
        this.mazeGraph = mazeGraph;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.difficultyRating = difficultyRating;
    }

    /**
     * Get a layout of the maze in grid form. 'X' means a wall piece, ' ' means an open area,
     * 'S' means the start location, and 'E' means the ending location.
     * 
     * @returns 2D layout
     */
    getArrayLayout() {
        var layout = new Array(2 * this.mazeGraph.height + 1);
        for (var y = 0; y < layout.length; y++) {
            layout[y] = new Array(2 * this.mazeGraph.width + 1);
            for (var x = 0; x < layout[y].length; x++) {
                layout[y][x] = 'X';
            }
        }

        for (var [k, v] of this.mazeGraph.nodes) {
            layout[2 * v.position[0] + 1][2 * v.position[1] + 1] = ' ';
        }

        for (var [a, b] of this.mazeGraph.edges) {
            var [posX, posY] = [
                2 * this.mazeGraph.getNode(a).position[0] + 1,
                2 * this.mazeGraph.getNode(a).position[1] + 1
            ];
            var [deltaX, deltaY] = [
                this.mazeGraph.getNode(b).position[0] - this.mazeGraph.getNode(a).position[0],
                this.mazeGraph.getNode(b).position[1] - this.mazeGraph.getNode(a).position[1]
            ];

            layout[posY + deltaY][posX + deltaX] = ' ';
        }

        layout[2 * this.startPosition[1] + 1][2 * this.startPosition[0] + 1] = 'S';
        layout[2 * this.endPosition[1] + 1][2 * this.endPosition[0] + 1] = 'E';

        return layout;
    }

    /**
     * Prints out the layout in string form
     */
    print() {
        var printOut = this.getArrayLayout().map(x => x.join('')).join('\n');
        console.log(printOut);
    }
}

/**
 * Generate a maze
 * 
 * @param {*} width             Width of the maze
 * @param {*} height            Height of the maze
 * @param {*} difficultyRating  0 - 1 Difficulty rating of the maze
 * @returns                     Maze object that stores start position, end position, difficulty, and entire maze graph
 */
export function generateMaze(width, height, difficultyRating) {
    var completeGraph = constructCompleteGraph(width, height);
    var mazeGraph = new MazeGraph(width, height);

    var deadEnds = new Array();

    function recurseBuild(currentId, length) {
        var openNodes = completeGraph.getNeighbors(currentId).filter((nodeId) => !mazeGraph.hasNode(nodeId));

        if (openNodes.length == 0) { // If this is the first visit and it has no available neighbors, dead end
            deadEnds.push([completeGraph.getNode(currentId).position, length]);
        }
        
        while (openNodes.length > 0) {
            var rand = Math.floor(random() * 100) % openNodes.length;
            var nextId = openNodes[rand];
            mazeGraph.addNode(new MazeNode(completeGraph.getNode(nextId).position, length + 1));
            mazeGraph.makeEdge(currentId, nextId);

            recurseBuild(nextId, length + 1);
            openNodes = completeGraph.getNeighbors(currentId).filter((nodeId) => !mazeGraph.hasNode(nodeId));
        }
    }

    var startPosition = [Math.floor(random() * (width)), Math.floor(random() * (width))];
    mazeGraph.addNode(new MazeNode(startPosition));
    recurseBuild(makeId(startPosition), 0);

    deadEnds.sort((a, b) => a[1] > b[1]);
    for (var [pos, len] of deadEnds) {
        console.log(String(pos) + " -> " + len);
    }

    difficultyRating = Math.min(Math.max(difficultyRating, 0.0), 1.0);
    var endIndex = Math.floor(difficultyRating * (deadEnds.length - 1));
    var endPosition = deadEnds[endIndex][0];

    console.log('maze generated!');

    return new Maze(mazeGraph, startPosition, endPosition, difficultyRating);
}

// Test Code
// var mazeWidth = 10;
// var mazeHeight = 10;
// var myMaze = generateMaze(mazeWidth, mazeHeight, 0.3);
// myMaze.print();
