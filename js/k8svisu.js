
//-- Variable definitions: ----------------------------------------------------

let loop=0;
let nodes = [];
let namespaces = [];
let services = [];
let deployments = [];
let replicasets = [];

let pods = [];

//-- Constant definitions: ----------------------------------------------------

const debug=true;
//const debug_loops=1;
//const debug_loops=0;
const debug_loops=1;
const debug_timing=false;

//-- Configuration definitions: -----------------------------------------------

const getClusterState_timeout = 5000;

let namespace="default";

const nodes_path="/api/v1/nodes";
const namespaces_path="/api/v1/namespaces";

let ingresscontrollers_path=undefined;
let services_path=undefined;
let deployments_path=undefined;
let replicasets_path=undefined;
let pods_path=undefined;

const connectionOverlays = [
    // to complete
];

//-- Function definitions: ----------------------------------------------------

const setPaths = (namespace) => {
    // set API paths based on current namespace:

    services_path    = "/api/v1/namespaces/" + namespace + "/services";
    pods_path        = "/api/v1/namespaces/" + namespace + "/pods";
    deployments_path = "/apis/apps/v1/namespaces/" + namespace + "/deployments";
    replicasets_path = "/apis/apps/v1/namespaces/" + namespace + "/replicasets";
};

const createElemDiv = (divclass, id, text, x, y) => {
    // create string <div> element

    const elemDiv=`<div class="${divclass}" id="'${id} style="left: '${x};top: ${y};" > ${text} </div>`;

    if (debug) { console.log(elemDiv); }
    return elemDiv;
};

const detectChanges = () => {
    // TODO: detect changes in API results ...

    return true;
};

const getClusterState = () => {
    // TODO: interrogate API for clusterState

};

const initialLoad = () => {
    // Initial jsPlumb load

    if (debug) { console.log("LOAD @ " + jQuery.now()); }
    jsPlumb.reset();

    let instance = jsPlumb.getInstance({
        ConnectionOverlays: connectionOverlays,
        Container: "k8s_cluster",
    });

    jsPlumb.fire("jsPlumbStarted", instance);

    getClusterState();
};

const redrawAll = (info) => {
    // When changes are detected, redraw cluster:

    $("#cluster").empty();
    if (debug) { console.log("redrawAll @ " + jQuery.now()); }

    $('#cluster').append(info);
};


//-- Main: --------------------------------------------------------------------

// your jsPlumb related init code goes here
jsPlumb.ready( initialLoad );

