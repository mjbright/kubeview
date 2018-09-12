
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

// Include type prefix in displayed element names, e.g. 'Service: <service-name>':
const include_type=true;

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

const capitalize1stChar = (word) => { let tmp=word; return tmp.replace(/^\w/, c => c.toUpperCase()); };

const setPaths = (namespace) => {
    // set API paths based on current namespace:

    services_path    = "/api/v1/namespaces/" + namespace + "/services";
    pods_path        = "/api/v1/namespaces/" + namespace + "/pods";
    deployments_path = "/apis/apps/v1/namespaces/" + namespace + "/deployments";
    replicasets_path = "/apis/apps/v1/namespaces/" + namespace + "/replicasets";
};

const createElemDiv = (divclass, id, text, x, y, tooltip) => {
    // create string <div> element

    let  type_info='';

    if (include_type) {
        type_info=capitalize1stChar(divclass)+': ';
    }
    const elemDiv=`<div class="${divclass} tooltip" data-tip="${tooltip}" id="'${id} style="left: '${x};top: ${y};" > ${type_info}${text} </div>`;

    if (debug) { console.log(elemDiv); }
    return elemDiv;
};

const detectChanges = () => {
    // TODO: detect changes in API results ...

    return true;
};

const getLabelsAnnotations = (object) => {
    let retStr='';

    // console.log( $.param( object.metadata.labels, true) );

    if (object.metadata.labels) {
        retStr += '\n    Labels: ' + $.param( object.metadata.labels, true)
    };

    if (object.metadata.annotations) {
        retStr += '\n    Annotations: ' + $.param( object.metadata.annotations, true)
    };

    return retStr;
}

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
            // TODO: Refactor this code => Need to understand Javascript variable scoping and objects first !!

            const doneReq=jQuery.now();
            def.resolve();
            const resolvedReq=jQuery.now();

            if (debug_timing) {
                console.log("1st req at: " + firstReq);
                console.log("last req at: " + lastReq + " after " + (lastReq-firstReq) + " msec");
                console.log("done     at: " + doneReq + " after " + (doneReq-firstReq) + " msec");
                console.log("resolved at: " + resolvedReq + " after " + (resolvedReq-firstReq) + " msec");
            }

            resolveRequests(nodes, namespaces, deployments, replicasets, pods, services);
    });
};

const resolveRequests = (nodes, namespaces, deployments, replicasets, pods, services) => {
    //----- Build up namespace dropdown menu:
    let namespaceList=[];
    let nsMenu='<select class="col dropbtn" id="nsmenu" >';
    namespaces.forEach( (namespace, index) => {
	//console.log(`namespace[${index}]: ${namespace.metadata.name}`);
	nsMenu += '<option value="' + namespace.metadata.name + '">' + namespace.metadata.name + '</option>';
	namespaceList.push(namespace.metadata.name);
    } );
    nsMenu += '</select>';

    // TODO: Add radio-button - show kubernetes entities?
    // TODO: Menu -> set namespace
    namespace_info='<div><div class="row" ><b>Namespace:</b> </div> <div class="col" >' + nsMenu + '</div> </div>'; // + namespace; 
    $('#k8s_namespace').empty();
    $('#k8s_namespace').append(namespace_info);
    
    // TODO: Calculate positions relative to nodes, last line of node:
    // - calculate in advance, number of nodes and number of entities in each node (whence height of node)
    // - place service/deploy/replicaset on Master node
    // - place pods on appropriat e worker node
    services_info='';
    services.forEach( (service, index) => {
	 let y=100+100*index;
	 let x=10; //100*index;

	 service.x = x; service.y = y;
	 if (service.metadata.name != 'kubernetes') {
	     labels=getLabelsAnnotations(service);
	     tooltip=`${service.metadata.uid} - ${service.metadata.name}  ${labels}`;
	     svcDiv = createElemDiv("service", service.metadata.uid, service.metadata.name, x, y, tooltip);
	     services_info+=svcDiv;
	     console.log(`service[${index}]: ${service.metadata.name}`);
	 }
     } );

     deploys_info='';
     deployments.forEach( (deployment, index) => {
	 let y=100+100*index;
	 let x=110; //100*index;

	 if (deployment.metadata.name != 'kubernetes') {
	     services.forEach( service => { 
		 if (service.metadata.name == deployment.metadata.name) {
		     x = service.x + 180; deployment.x = x;
		     y = service.y + 50;  deployment.y = y;
		     //!! no break;
		 }
	     })

	     replicas=`${deployment.status.readyReplicas} / ${deployment.spec.replicas}`;
	     deploymentText=`${deployment.metadata.name} <br/> ${replicas} replicas`;
	     tooltip=`${deployment.metadata.uid} - '${deployment.metadata.name}`;
	     deploymentDiv = createElemDiv("deployment", deployment.metadata.uid, deploymentText, x, y, tooltip);

	     deploys_info+=deploymentDiv;
	 }
	// console.log(`deployment[${index}]: ${deployment.metadata.name}`);
     } );

replicasets_info='';
lastreplicaset=0;
replicasets.forEach( (replicaset, index) => {
    let y=100+100*index;
    let x=110; //100*index;

    lastreplicaset=replicaset;

    if (replicaset.metadata.name != 'kubernetes') {
	deployments.forEach( deployment => { 
	    if (deployment.metadata.name == replicaset.metadata.name) {
		x = deployment.x + 180; replicaset.x = x;
		y = deployment.y + 50;  replicaset.y = y;
		//!! no break;
	    }
	})

	//replicas=`${deployment.status.readyReplicas} / ${deployment.spec.replicas}`;
	replicasetText=`${replicaset.metadata.name}`;  // + //'<br/>' + //replicas + ' replicas</div>';
	replicasetDiv=createElemDiv("replicaset", replicaset.metadata.uid, replicasetText, x, y, tooltip);

	replicasets_info+=replicasetDiv;
	//console.log(replicaset);
    }
   // console.log(`replicaset[${index}]: ${replicaset.metadata.name}`);
} );

pods_info=''
x = 0;

if (lastreplicaset) {
    y = lastreplicaset.y+100;
    pods.forEach( (pod, index) => {
	console.log(`pod[${index}]: ${pod.metadata.name}`);
	podText = pod.metadata.name;
	x += 100;
    
	tooltip=`${pod.metadata.uid} - '${pod.metadata.name}`;
	podDiv = createElemDiv("pod", pod.metadata.uid, podText, x, y, tooltip);
	pods_info += podDiv;
    });
}

    let masterIdx=undefined;
    nodes.forEach( (node, index)      => {
	if ('node-role.kubernetes.io/master' in node.metadata.labels) {
	    name = '*' + node.metadata.name;
	    role = 'master';
	    masterIdx=index;
	    master=nodes[index];
	    //console.log("MASTER=" + index);
	}
    });

    if (masterIdx == undefined) {
	console.log("Failed to detect Master node");
    }
    console.log(`MASTER=node[${masterIdx}]='${master.metadata.name}'`);

    ALL_info=''
    nodes.forEach( (node, index)      => {
	//let y=1000*index;
	let y=0*index;
	let x=0; //100*index;

	name = node.metadata.name;
	role = 'worker';
	if ('node-role.kubernetes.io/master' in node.metadata.labels) {
	    name = '*' + node.metadata.name;
	    role = 'master';
	}

	nodeText='<i>' + name + '</i>';
	if (role == 'master') {
	     nodeText += services_info + deploys_info + replicasets_info + pods_info;
	} else {
	     nodeText += pods_info;
	}

	tooltip=`${node.metadata.uid} - '${node.metadata.name}`;
	nodeDiv = createElemDiv("node", node.metadata.uid, nodeText, x, y, tooltip);

	ALL_info += nodeDiv;
	// console.log(`node[${index}]: ${node.metadata.name}`);
    } );


    if (debug_loops != 1) {
	setTimeout(reload, getClusterState_timeout);
    }

    // Redraw cluster only when changes are detected:
    if (detectChanges()) {
	redrawAll(ALL_info);
    }

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

