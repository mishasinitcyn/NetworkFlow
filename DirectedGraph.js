class Vertex{
    constructor(id){
        this.id = id;
    }
}

class Edge{
    constructor(vertexOne, vertexTwo, flow, capacity=10){
        this.vertexOne = vertexOne;
        this.vertexTwo = vertexTwo;
        this.flow = flow;
        this.capacity = capacity;
    }   
}

class Graph{
    constructor(){
        this.Edges = []
        this.Vertices = []
        this.sourceID = 's';
        this.sinkID = 't';
    }

    populate(){
        this.addVertex(this.sourceID);
        this.addVertex('v1');
        this.addVertex('v2');
        this.addVertex(this.sinkID);
        
        this.addEdge('s','v1',1);
        this.addEdge('s','v2',2);
        this.addEdge('v1','v2',3);
        //this.addEdge('v2','v1',7);
        this.addEdge('v1','t',4);
        this.addEdge('v2','t',5);
    }

    addVertex(id){
        this.Vertices.push(new Vertex(id));
    }

    addEdge(id1, id2, flow){
        this.Edges.push(
            new Edge(
                this.Vertices.find(Vertex => Vertex.id === id1), 
                this.Vertices.find(Vertex => Vertex.id === id2), 
                flow
            )
        );
    }

    findMaxEdgeFlow(){
        return Math.max.apply(Math, this.Edges.map(function(edge) {return edge.flow}));
    }

    findMinEdgeFlow(){
        return Math.min.apply(Math, this.Edges.map(function(edge) {return edge.flow}));
    }

    BFSTree(rootVertexID){        
        if(rootVertexID === 't') return true;

        //Finds all outgoing edges from rootVertexID
        let outgoingEdges = this.Edges.filter(function(edge){
            if(edge.vertexOne.id === rootVertexID) return edge.vertexOne.id;
        })
        
        //Finds max flow outgoing edge
        let maxOutgoingFlow = Math.max.apply(Math, outgoingEdges.map(function(edge) {return edge.flow}))        
        let maxOutgoingEdge = outgoingEdges.filter(function(edge){
            if(edge.flow === maxOutgoingFlow) return edge;
        })

        if(maxOutgoingEdge.length >0){
            for(let i = 0; i < maxOutgoingEdge.length; i++){
                if(this.BFSTree(maxOutgoingEdge[i].vertexTwo.id)){
                    return true;
                }
            }
            for(let i = 0; i < outgoingEdges.length; i++){
                if (this.BFSTree(outgoingEdges[i].vertexTwo.id)) return true;
            }
        }
        return;
    }

    FindPath(rootVertexID){
        const pathEdges = []
        return this.BFSPath(rootVertexID, pathEdges);
    }

    BFSPath(rootVertexID, pathEdges){
        //Store the visited status of vertices in a dictionary for O(1) lookup time
        let visitedNodes = {};
        for(const vertex of Object.entries(this.Vertices)){
            visitedNodes[vertex[1].id] = "unvisited";
        }

        let p = []; // Path p in G
        let Q = []; // Queue Q used for BFS
        Q.push(rootVertexID);

        while(Q.length > 0){
            let v = Q.shift();
            visitedNodes[v] = 'visited';
            p.push(v);
            if(v === 't') {console.log("PATH FOUND"); console.log(p)}

            //Find all neighbours w of v in G`
            //Might have to change the BFS to add vertices by weight
            //Also, wouldn't DFS make more sense?
            let outgoingEdges = this.Edges.filter(function(edge){
                if(edge.vertexOne.id === v) return edge.vertexOne.id;
            })
            let neighbourVertices = [];
            for(const outgoingEdge of Object.entries(outgoingEdges)){
                neighbourVertices.push(outgoingEdge[1].vertexTwo.id);
            }
            console.log(`Neighbours of ${v}: ` + neighbourVertices);

            //If neighbour w is not visited, add to Q
            for(const w of Object.entries(neighbourVertices)){
                if(visitedNodes[w[1]] === 'unvisited'){
                    if(!Q.includes(w[1])) Q.push(w[1]);
                }
            }
        }

        
        return pathEdges;
    }

    maximumFlow(){
        if(!this.BFSTree('s')) return -1;
        return this.FordFulkerson();
    }

    FordFulkerson(){
        //Create Residual Graph G`
        var residualGraph = new Graph();
        residualGraph.addVertex(this.sourceID);
        residualGraph.addVertex(this.sinkID);

        //Add Vertices in G to G` | O(V)
        for(const vertex of Object.entries(this.Vertices)){
            residualGraph.addVertex(vertex[1].id);
        }

        //Add Residual Flow Edges to G` | O(E^2)
        for(const edge of Object.entries(this.Edges)){
            let newFlow = edge[1].capacity - edge[1].flow;
            
            let residualEdgeFlow = this.Edges.filter(function(resEdge){
                if(resEdge.vertexOne.id === edge[1].vertexTwo.id && resEdge.vertexTwo.id === edge[1].vertexOne.id ) return resEdge.flow;
            })
            if(residualEdgeFlow.length > 0){
                newFlow = residualEdgeFlow[0].flow;
            }
            residualGraph.addEdge(edge[1].vertexOne.id, edge[1].vertexTwo.id, newFlow);
        }

        //Add the Back Edges | O(E^2)
        for(const edge of Object.entries(this.Edges)){
            let residualEdgeFlow = residualGraph.Edges.filter(function(resEdge){
                if(resEdge.vertexOne.id === edge[1].vertexTwo.id && resEdge.vertexTwo.id === edge[1].vertexOne.id ) return resEdge;
            })
            if(residualEdgeFlow.length === 0){
                residualGraph.addEdge(edge[1].vertexTwo.id, edge[1].vertexOne.id, edge[1].flow);
            }
        }

        //Augmenting Flows PAGE 16 in Lecture 09

        //First, set flow of every edge in E to zero. | O(E)
        for(const edge of Object.entries(this.Edges)){
            edge[1].flow = 0;
        }

        //While there is a path p from s to t in residualGraph:
        //capacity of p = min of all edge capacities in p
        //for each edge (u,v) in p
        //  if(u,v) is in this.Edges
        //      (u,v).flow = (u,v).flow + capacity of p
        //  else (v,u).flow = (v,u).flow - capacity of p

        //Always choose p as the shortest path form s to t in the residual network
        //Using BFS
        //This is the Edmonds-Karp algorithm
        //Find path in residual network via BFS, increase all v in p 
        //Until a flow on some v in p on G` is zero, meaning capacity is reached
        
        /*
        while(residualGraph.BFSTree(this.sourceID)){
            let path_flow = Number.MAX_VALUE;
        }
        */

        return "Max Flow";
    }

}

var G = new Graph();

G.populate();
console.log(G.maximumFlow());

console.log(G.FindPath('s'));