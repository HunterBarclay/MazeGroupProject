# Maze Group Project
This is a group project for CS464. Team is Hunter Barclay, Josh Martin, Jordan Casper.

## Planning
[Trello Board](https://trello.com/b/FvLTHeI2/maze).

## Technologies Used
This project will use JavaScript within an html page. We will make use of WebGL for 3d graphics.

## License
This repository is under the [MIT License](/LICENSE.md).

Read below to see which assets/files were sourced under different licenses.

## The Code
### Core Components
#### Renderer
TBD

#### Maze Generation
##### Example
![maze example](/docs/maze-sample.png)

This is an example of a generate maze. The start is marked with an `S` and the end is marked with an `E`.

##### Algorithm
The maze generation starts with a grid graph, with each node connected to its vertical and horizontal neighbors. We then construct a second graph that starts with some random node in the former. Then if it has a neighbor not in the new graph, we randomly select one to add to the new graph and create an edge between the start node and the new node. We then recursively do this for the new node, then reevaluate and do this until all nodes in the original graph are in the new graph.

We store all leaf nodes of the new graph (except for the start node if it is a leaf node) and sort them in ascending order by distance from the starting node. We then use a difficulty factor to determine how close to the front or back of this list we pick the end point.

#### Main Game Loop
### Techniques of Note
#### Batch Rendering
For rendering the walls of the maze, we will be utilizing batch rendering to try and make rendering multiple of the same mesh faster.

#### Frustrum Culling
With making use of batch rendering, we'll be using frustrum culling to determine which parts of the maze can actually be seen by the user and only render those. This will cut down on the number of objects we need to render considerably.

## Assets
### Meshes
The [Sphere Mesh](/assets/meshes/sphere.obj) was created in Blender.

### Textures
The following textures were all distributed under a [Creative Commons License](/assets/textures/CC_LICENSE.md) and were sourced from [3D Textures](https://3dtextures.me/):
- [Terracotta Tiles Textures](/assets/textures/style-brick2/)
- [Stylized Bricks Textures](/assets/textures/style-brick2/)
- [Stylized Grass Textures](/assets/textures/style-grass/)
- [Abstract Metal Textures](/assets/textures/abstract-metal/)
- [Basic Metal Textures](/assets/textures/metal/)
