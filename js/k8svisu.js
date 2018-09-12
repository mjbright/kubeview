
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
var debug_loops=1;
const debug_timing=false;

// Include type prefix in displayed element names, e.g. 'Service: <service-name>':
const include_type=true;

//-- Configuration definitions: -----------------------------------------------

const getClusterState_timeout = 5000;

var namespace="default";

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

const die = (msg) => {
    console.log('die: ' + msg);
    throw '';
};

const setPaths = (namespace) => {
    // set API paths based on current namespace:

    services_path    = "/api/v1/namespaces/" + namespace + "/services";
    pods_path        = "/api/v1/namespaces/" + namespace + "/pods";
    deployments_path = "/apis/apps/v1/namespaces/" + namespace + "/deployments";
    replicasets_path = "/apis/apps/v1/namespaces/" + namespace + "/replicasets";
};

const createElemDiv = (divclass, id, text, x, y, tooltip, fg, bg) => {
    return startElemDiv(divclass, id, text, x, y, tooltip, fg, bg) + ' </div>';
}

const startElemDiv = (divclass, id, text, x, y, tooltip, fg, bg) => {
    // create string <div> element

    let  type_info='';

    if (include_type) {
        type_info=capitalize1stChar(divclass)+': ';
    }

    color_style=''
    if (fg != undefined) { color_style+='color: ' + fg + ';'; }
    if (bg != undefined) { color_style+='background: ' + bg + ';'; }
    const stElemDiv=`<div class="${divclass} tooltip" data-tip="${tooltip}" id="${id} style="left: ${x};top: ${y};${color_style}" > ${type_info}${text}`;

    if (debug) { console.log(stElemDiv)+' </div>'; }
    return stElemDiv;
};

const detectChanges = () => {
    // TODO: detect changes in API results ...


    console.log(`#nodes=${nodes.length}`);

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

const changeNamespace = () => {
    var selectBox = document.getElementById("nsmenu");
    var selectedValue = selectBox.options[selectBox.selectedIndex].value;
    namespace = selectedValue;

    console.log(window.namespace);
    console.log(namespace);
    //debug_loops+=1;
    //setTimeout(getClusterState, getClusterState_timeout);

    // force cluster update:
    getClusterState();
};

const buildNamespaceMenu = (namespaces) => {
    let namespaceList=[];
    let nsMenu='<select class="col dropbtn" id="nsmenu" onchange="changeNamespace();" >';

    namespaces.forEach( (option_namespace, index) => {

	//console.log(`option_namespace[${index}]: ${option_namespace.metadata.name}`);
	    //
	let selected='';
	if (option_namespace.metadata.name == namespace) {
	    selected=' selected="selected"';
	}

	nsMenu += `<option value="${option_namespace.metadata.name}" ${selected}> ${option_namespace.metadata.name} </option>`;
	namespaceList.push(option_namespace.metadata.name);
    } );

    nsMenu += '</select>';
    return nsMenu;
};


const getMasterIndex = (nodes) => {
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
    // console.log(`MASTER=node[${masterIdx}]=${master.metadata.name}'`);

    return [masterIdx, master.metadata.name];
};

const getNodeIndex = (nodes, nodeName) => {
    var nodeIndex = -1;

    nodes.forEach( (node, index) => {
	if (node.metadata.name == nodeName) {
	    //console.log(`${node.metadata.name} == ${nodeName}`);
            nodeIndex = index;
        }
	//console.log(`${node.metadata.name} != ${nodeName}`);
    });

    //console.log(nodeIndex);
    if (nodeIndex != -1) {
	return nodeIndex;
    }

    die(`Failed to find node <${nodeName}> in list`);
    return -1;
};

const resolveRequests = (nodes, namespaces, deployments, replicasets, pods, services) => {

    //----- Build up namespace dropdown menu:
    const nsMenu = buildNamespaceMenu(namespaces);

    // TODO: Add modals as prettier tooltips ..

    // TODO: Add radio-button - show kubernetes entities?
    // TODO: Menu -> set namespace
    namespace_info='<div><div class="row" ><b>Namespace:</b> </div> <div class="col" >' + nsMenu + '</div> ' + sourceURL + ' </div>'; // + namespace;
    $('#k8s_namespace').empty();
    $('#k8s_namespace').append(namespace_info);

    var ALL_info=''
    var nodeDivText=[];

    // Determine which is the (only) Master node:
    const retList = getMasterIndex(nodes);
    let masterIdx = retList[0];
    let masterNode = retList[1];
    console.log(`MASTER=node[${masterIdx}]=${masterNode}'`);

    nodes.forEach( (node, index)      => {
	//let y=1000*index;
	let y=0*index;
	let x=0; //100*index;

        nodeDivText[index]='';

	name = node.metadata.name;
	role = 'worker';
	if (index == masterIdx) {
	    name = '*' + node.metadata.name;
	    role = 'master';
	}

	nodeDivText[index]+='<i>' + name + '</i>';
	tooltip=`${node.metadata.uid} - ${node.metadata.name}`;
	nodeDivText[index] = startElemDiv("node", node.metadata.uid, nodeDivText[index], x, y, tooltip);
    });

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
     nodeDivText[masterIdx]+=services_info;

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
	     tooltip=`${deployment.metadata.uid} - ${deployment.metadata.name}`;
	     deploymentDiv = createElemDiv("deployment", deployment.metadata.uid, deploymentText, x, y, tooltip);

	     deploys_info+=deploymentDiv;
	 }
	// console.log(`deployment[${index}]: ${deployment.metadata.name}`);
     } );
     nodeDivText[masterIdx]+=deploys_info;

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
     nodeDivText[masterIdx]+=replicasets_info;

     x = 0;
     y = 0;

     //if (lastreplicaset) {
         //y = lastreplicaset.y+100;
     let loop=0;
     console.log(`#pods=${pods.length}`);
     pods.forEach( (pod, index) => {
	 console.log(`pod[${index}]: ${pod.metadata.name}`);
	 podText = pod.metadata.name;
	 x += 100;
         loop++;

	 console.log( `${pod.metadata.uid} - ${pod.metadata.name} on ${pod.spec.nodeName}` );

	 tooltip=`${pod.metadata.uid} - ${pod.metadata.name}`;

	 fg=undefined;
	 bg=undefined;
         if ( pod.status.phase == "Running" ) {
	     // color based on style, label color or version ...
	     fg=undefined;
	 } else if ( pod.status.phase == "Error" ) {
	     fg='red';
	 } else {
             // Pending, Container Creating
	     fg='orange';
	 }
	 //fg='green';
	 //bg='brown';
	 fg='#0a0';
	 bg='#aa0';
	 podDiv = createElemDiv("pod", pod.metadata.uid, podText, x, y, tooltip, fg, bg);
	 const pod_info = podDiv;

	 // just for fun: attribute to the 3 nodes for now:
	 // nodeDivText[loop % nodeDivText.length] += pod_info;
	     //
	 // TODO: Use nodeName to find nodeIndex:
         nodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
         console.log(`${pod.metadata.name} is '${pod.status.phase}' on node[${nodeIndex}] '${pod.spec.nodeName}'`);


	 nodeDivText[nodeIndex] += pod_info;
     });

     nodes.forEach( (node, index)      => {
	 ALL_info += nodeDivText[index] + ' </div>';
     });

     // Redraw cluster only when changes are detected:
     if (detectChanges()) {
	 redrawAll(ALL_info);
     }

     if (debug_loops != 1) {
	 console.log(`setTimeout=${getClusterState_timeout}`);
	 setTimeout(getClusterState, getClusterState_timeout);
     } else {
	 console.log('NO timeout set - stopping');
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

