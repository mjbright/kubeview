
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
    // interrogate API for clusterState

    let def = $.Deferred();

    // EMPTY OUT WHOLE cluster canvas: TODO - do this intelligently
    // Don't redisplay at all if no changes seen via APIs.
    $('#cluster').empty();

    setPaths(namespace);

    const firstReq=jQuery.now();
    let requests = [ ]

    const getnodes=true;
    const getns=true;
    const getservices=true;
    const getdeploys=true;
    const getrs=true;
    const getpods=true;

    // TODO: dependent on getnodes, etc? ...
    /*nodes = [];
    namespaces = [];
    deployments = [];
    replicasets = [];
    pods = [];
    services = [];*/
 
    if ( getnodes ) {
        const nodesReq = $.getJSON(nodes_path, (obj) => {
            if (obj.items == undefined) { return; }
            nodes = obj.items; nodes.forEach( (item) => { item.kind='node';} ) });
        requests.push(nodesReq);
    }
    if ( getns ) {
        const namespacesReq = $.getJSON(namespaces_path, (obj) => {
            if (obj.items == undefined) { return; }
            namespaces=obj.items; namespaces.forEach( (item) => { item.kind='namespace';} ) });
        requests.push(namespacesReq);
    }
    if ( getservices ) {
        const servicesReq   = $.getJSON(services_path,   (obj) => {
            if (obj.items == undefined) { return; }
            services=obj.items; services.forEach( (item) => { item.kind='service';} ) });
        requests.push(servicesReq);
    }
    if ( getdeploys ) {
        const deploymentsReq   = $.getJSON(deployments_path,   (obj) => {
            if (obj.items == undefined) { return; }
            deployments=obj.items; deployments.forEach( (item) => { item.kind='deployment';} ) });
        requests.push(deploymentsReq);
    }
    if ( getrs ) {
        const replicasetsReq   = $.getJSON(replicasets_path,   (obj) => {
            if (obj.items == undefined) { return; }
            replicasets=obj.items; replicasets.forEach( (item) => { item.kind='replicaset';} ) });
        requests.push(replicasetsReq);
    }
    if ( getpods ) {
        const podsReq   = $.getJSON(pods_path,   (obj) => {
            if (obj.items == undefined) { return; }
            pods=obj.items; pods.forEach( (item) => { item.kind='pod';} ) });
        requests.push(podsReq);
    }

    const lastReq=jQuery.now();

    $.when.apply( $, requests ).done( () => {
            // TODO: DETECT CHANGES, only do empty+redraw when changes occur
            // TODO: Don't check nodes, namespaces at each iteration
            // TODO: Determine nodes first, determine number of entries (Service/Deploy/ReplicaSets/Pods) to determine space needed
            // TODO: Correct dependency between different entities (Service/Deploy/ReplicaSets/Pods)
            // TODO: Refactor this code

            const doneReq=jQuery.now();
            def.resolve();

    });

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

