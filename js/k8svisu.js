
//-- Variable definitions: ----------------------------------------------------

let loop=0;
let nodes = [];
let namespaces = [];
let services = [];
let deployments = [];
let replicasets = [];
let pods = [];
let configHash='';
let force_redraw=false;

//-- Constant definitions: ----------------------------------------------------

const debug=false;
const debug_nodes=false;
const debug_services=false;
const debug_deploys=false;
const debug_replicasets=false;
const debug_pods=false;
const debug_connect=true;

const debug_node = (msg) => { if (debug_nodes)    console.log("debug_node: " + msg); }
const debug_svc  = (msg) => { if (debug_services) console.log("debug_service: " + msg); }
const debug_dep  = (msg) => { if (debug_deploys)  console.log("debug_deploy: " + msg); }
const debug_rs   = (msg) => { if (debug_replicasets) console.log("debug_replicaset: " + msg); }
const debug_pod  = (msg) => { if (debug_pods)     console.log("debug_pod: " + msg); }

//const debug_loops=1;
//const debug_loops=0;
//var debug_loops=1;
var pause_visu=false;
var show_kube_components=false;
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


const createElemDiv = (classes, id, text, x, y, tooltip, fg, bg) => {
    return startElemDiv(classes, id, text, x, y, tooltip, fg, bg) + ' </div>';
}

const startElemDiv = (classes, id, text, x, y, tooltip, fg, bg) => {
    // create string <div> element

    let  type_info='';

    if (include_type) {
    // First class is the type:
        let type=classes.split(" ")[0];
        type_info=capitalize1stChar(type)+': ';
    }

    color_style=''
    if (fg != undefined) { color_style+='color: ' + fg + ';'; }
    if (bg != undefined) { color_style+='background-color: ' + bg + ';'; }
    //const stElemDiv=`<div class="${classes} tooltip" data-tip="${tooltip}" id="${id}" style="left: ${x};top: ${y};${color_style}" > ${type_info}${text}`;
    if (color_style == '') {
        stElemDiv=`<div class="${classes} tooltip" data-tip="${tooltip}" id="${id}" > ${type_info}${text}`;
    } else {
        stElemDiv=`<div class="${classes} tooltip" data-tip="${tooltip}" id="${uid}" style="${color_style}" > ${type_info}${text}`;
    }


    if (type == 'node' && debug_node) {
        console.log(stElemDiv+' </div>');
    } else if (type == 'service' && debug_svc) {
        console.log(stElemDiv+' </div>');
    } else if (type == 'deployment' && debug_dep) {
        console.log(stElemDiv+' </div>');
    } else if (type == 'replicaset' && debug_rs) {
        console.log(stElemDiv+' </div>');
    } else if (type == 'pod' && debug_pod) {
        console.log(stElemDiv+' </div>');
    } else {
        if (debug) { console.log(stElemDiv+' </div>'); }
    }

    return stElemDiv;
};

const detectChanges = () => {
    // TODO: detect changes in API results ...

    let oldConfigHash=configHash;

    configHash='';

    nodes.forEach( (node, index) => {
        configHash += node.metadata.uid
    // todo state:
    });
    services.forEach( (service, index) => {
        configHash += service.metadata.uid
    // todo state ??:
    });
    deployments.forEach( (deploy, index) => {
        configHash += deploy.metadata.uid
    // todo state ??:
    });
    replicasets.forEach( (replicaset, index) => {
        configHash += replicaset.metadata.uid
    // todo state ??:
    });
    pods.forEach( (pod, index) => {
        configHash += pod.metadata.uid
    // todo state ??:
    });

    if (configHash == oldConfigHash) {
        //console.log(`detectChanges: NO-REDRAW configHash=${configHash} == ${oldConfigHash}`);
        return false;
    }

    //console.log(`detectChanges: REDRAW configHash=${configHash} != ${oldConfigHash}`);
    //console.log(`#nodes=${nodes.length}`);

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
    //$('#cluster').empty();

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

    // force cluster update:
    getClusterState();
    force_redraw=true;
};

const buildNamespaceMenu = (namespaces) => {
    let namespaceList=[];
    let nsMenu='<select class="col dropbtn" id="nsmenu" onchange="changeNamespace();" >';

    namespaces.forEach( (option_namespace, index) => {
        //console.log(`option_namespace[${index}]: ${option_namespace.metadata.name}`);
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

const createDeploymentDiv = (deployment) => {
    replicas=`${deployment.status.readyReplicas} / ${deployment.spec.replicas}`;
    //deploymentText=`${deployment.metadata.name} <br/> ${replicas} replicas`;
    deploymentText=`${deployment.metadata.name} , ${replicas} replicas`;
    tooltip=`${deployment.metadata.uid} - ${deployment.metadata.name}`;
    x=0; y=0;
    deploymentDiv = createElemDiv("deployment col", deployment.metadata.uid, deploymentText, x, y, tooltip);
    return deploymentDiv;
};

const createReplicaSetDiv = (replicaset) => {
    //replicas=`${replicaset.status.readyReplicas} / ${replicaset.spec.replicas}`;
    //replicasetText=`${replicaset.metadata.name} <br/> ${replicas} replicas`;
    replicasetText=`${replicaset.metadata.name}`;  // + //'<br/>' + //replicas + ' replicas</div>';
    tooltip=`${replicaset.metadata.uid} - ${replicaset.metadata.name}`;
    x=0; y=0;
    replicasetDiv = createElemDiv("replicaset col", replicaset.metadata.uid, replicasetText, x, y, tooltip);
    return replicasetDiv;
};

const indexOfUIDInList = (idlist, id) => {
    var foundIdx=-1;

    idlist.forEach( (item_id, index) => {
        if (item_id == id) { foundIdx = index; return; }
    });
    return (foundIdx);
};

const resolveRequests = (nodes, namespaces, deployments, replicasets, pods, services) => {

    //----- Build up namespace dropdown menu:
    const nsMenu = buildNamespaceMenu(namespaces);

    // TODO: Add modals as prettier tooltips ..
    let checked='';

    if (!pause_visu) { checked="checked='checked'"; }
    let runningButtonText='<div class="col">' +
        '<input type="checkbox" id="run_or_pause" name="run_or_pause" ' + checked + ' value="Run" />' +
        '<label for="Run">Run</label>' +
      '</div>';

    checked='';
    if (show_kube_components) { checked="checked='checked'"; }
    let showKubeCompButtonText='<div class="col">' +
        '<input type="checkbox" id="show_kubernetes" name="show_kubernetes" ' + checked + ' value="show_all" />' +
        '<label for="show_all">Show Kubernetes components</label>' +
      '</div>';

    let toplineMenu='<div><div class="row" ><b>Namespace:</b> </div> <div class="col" >' + nsMenu + '</div> ' +
            runningButtonText + showKubeCompButtonText + ';&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ' + sourceURL + ' </div>';

    $('#k8s_namespace').empty();
    $('#k8s_namespace').append(toplineMenu);

    let runningButton = document.querySelector('#run_or_pause');
    let showKubeCompButton = document.querySelector('#show_kubernetes');
    runningButton.addEventListener('click', (e) => {
        pause_visu = !pause_visu;
        if (pause_visu) {
            console.log("Visualization paused");
        } else {
            console.log("Visualization restarted");
            setTimeout(getClusterState, getClusterState_timeout);
        };
    });

    showKubeCompButton.addEventListener('click', (e) => {
        show_kube_components = !show_kube_components;
        if (show_kube_components) {
            console.log("Show Kubernetes Components");
        } else {
            console.log("Hide Kubernetes Components");
        };
     });

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

    deploys_seen=[];
    replicasets_seen=[];

    services_info='';
    services.forEach( (service, index) => {
        //let y=100+100*index;
        //let y=100*index;
        let y=0;
        let x=10; //100*index;

        service.x = x; service.y = y;
        if (show_kube_components || (service.metadata.name != 'kubernetes')) {
            labels=getLabelsAnnotations(service);
            tooltip=`${service.metadata.uid} - ${service.metadata.name}  ${labels}`;
            svcDiv = '';

            svcDiv += '<div>';
            //svcDiv += '<div class="row">';
            //svcDiv += createElemDiv("service row", service.metadata.uid, service.metadata.name, x, y, tooltip);
            svcDiv += createElemDiv("service", service.metadata.uid, service.metadata.name, x, y, tooltip);
            //svcDiv += '</div>';
            deployments.forEach( (deployment, index) => {
                if (show_kube_components || (deployment.metadata.name != 'kubernetes')) {
                    if (service.metadata.name == deployment.metadata.name) {
                        //svcDiv += '<div class="col">';
                        deploys_seen.push( deployment.metadata.uid );
                        svcDiv += createDeploymentDiv(deployment);
                        //svcDiv += '</div>';

                        // replicaset.metadata.ownerReferences.name: flask-app (Deployment)
                        replicasets.forEach( (replicaset, index) => {
                            if (show_kube_components || (replicaset.metadata.name != 'kubernetes')) {
                                owners = replicaset.metadata.ownerReferences;
                    owners.forEach( (owner) => {
                                    if (deployment.metadata.name == owner.name) {
                                        //svcDiv += '<div class="col">';
                            if (replicaset.spec.replicas != 0) {
                                            console.log(`${replicaset.metadata.name}: [${replicaset.spec.replicas}] ${deployment.metadata.name} == ${owner.name}`);
                                            replicasets_seen.push( replicaset.metadata.uid );
                                            svcDiv += createReplicaSetDiv(replicaset);
                                }
                                        //svcDiv += '</div>';
                            //} else {
                                        //console.log(`${deployment.metadata.name} != ${owner.name}`);
                        }
                    });
                    }
                        });
                    }
                }
            });

// die("CHECK");
            svcDiv += '</div>';
            svcDiv += '<br/>';
            services_info+=svcDiv;
            console.log(`services_info='${services_info}'`);
        //die("CHECK THIS OUT");

            console.log(`service[${index}]: ${service.metadata.name}`);
        //XX add deployments/replicasets
        }
     } );
     nodeDivText[masterIdx]+=services_info;

     deploys_info='';
     deployments.forEach( (deployment, index) => {
         // let y=100+100*index;
         let y=0;
         let x=110; //100*index;

         itemSeenIdx = indexOfUIDInList(deploys_seen, deployment.metadata.uid);
     console.log(`${itemSeenIdx} ${deployment.metadata.uid}`);
     //console.log(`${itemSeenIdx} ` + $.param( deployment.metadata, true));

     if (itemSeenIdx == -1) {
             if (show_kube_components || (deployment.metadata.name != 'kubernetes')) {
                 services.forEach( service => {
                     if (service.metadata.name == deployment.metadata.name) {
                         //x = service.x + 180; deployment.x = x;
                         //y = service.y + 50;  deployment.y = y;
                         //!! no break;
                     }
                 })
                 deploys_info+=createDeploymentDiv(deployment);
             }
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

         itemSeenIdx = indexOfUIDInList(replicasets_seen, replicaset.metadata.uid);
     if (itemSeenIdx == -1) {
             if (show_kube_components || (replicaset.metadata.name != 'kubernetes')) {
             //deployments.forEach( deployment => {
                 //if (deployment.metadata.name == replicaset.metadata.name) {
                     //x = deployment.x + 180; replicaset.x = x;
                     //y = deployment.y + 50;  replicaset.y = y;
                     ////!! no break;
                 //}
             //})

             if (replicaset.spec.replicas != 0) {
                     replicasets_info += createReplicaSetDiv(replicaset);
                     //console.log(replicaset);
                 }
             }
         }
         // console.log(`replicaset[${index}]: ${replicaset.metadata.name}`);
     } );
     nodeDivText[masterIdx]+=replicasets_info;

     x = 0;
     y = 0;

     console.log(`#pods=${pods.length}`);
     lastImage=undefined;
     pods.forEach( (pod, index) => {
         if (debug_pod) { console.log(`pod[${index}]: ${pod.metadata.name}`); }
         podText = pod.metadata.name;
         x += 100;
         loop++;

         if (debug_pod) { console.log( `${pod.metadata.uid} - ${pod.metadata.name} on ${pod.spec.nodeName}` ); }

         tooltip=`${pod.metadata.uid} - ${pod.metadata.name}`;

         image=pod.spec.containers[0].image
         fg=undefined;
         bg=undefined;
         // pod.status.phase = "Error";
         if ( pod.status.phase == "Running" ) {
             // color based on style, label color or version ...
             fg=undefined;
             if (image.indexOf("v1") != -1) {
                 bg='#aa0';
         } else if (image.indexOf("v2") != -1) {
                 bg='#aa0';
         } else if (image.indexOf("v3") != -1) {
                 bg='#0aa';
         } else if (image.indexOf("v4") != -1) {
                 bg='#0a0';
         } else if (image.indexOf("v5") != -1) {
                 bg='#00a';
         } else {
                 bg='#660';
         }
         } else if ( pod.status.phase == "Error" ) {
             fg='red';
             bg='pink';
         } else {
             // Pending, Container Creating
             fg='orange';
         }

     classes="pod"
     if (image == lastImage) {
         classes += " row"
         }
         podDiv = createElemDiv(classes, pod.metadata.uid, podText, x, y, tooltip, fg, bg);

         lastImage=image;
         const pod_info = podDiv;

         nodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
         console.log(`${pod.metadata.name} is '${pod.status.phase}' on node[${nodeIndex}] '${pod.spec.nodeName}'`);

         nodeDivText[nodeIndex] += pod_info;
     });

     nodes.forEach( (node, index)      => {
         ALL_info += nodeDivText[index] + ' </div>';
     });

     // Redraw cluster only when changes are detected:
     if ( force_redraw || detectChanges() ) {
         redrawAll(ALL_info);
     }

     if (pause_visu) {
         console.log('NO timeout set - stopping');
     } else {
         console.log(`setTimeout=${getClusterState_timeout}`);
         setTimeout(getClusterState, getClusterState_timeout);
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
    pods.forEach( (pod, index) => {
        owners = pod.metadata.ownerReferences;
        owners.forEach( (owner, index) => {

            if (debug_connect) {
                // console.log( $.param( owner, true) );
                console.log(`jsPlumb.connect( source[pod/${pod.metadata.name}]: ${pod.metadata.uid}, target[${owner.kind}/${owner.name}]: ${owner.uid} );`);

	      //ownerReference
	      // [ { apiVersion: 'apps/v1', kind: 'Deployment', name: 'redis', uid: 'f8134aa4-b534-11e8-8a06-525400c9c704', controller: true, blockOwnerDeletion: true } ] },
	    }

            jsPlumb.connect({
                source: pod.metadata.uid,
                target: owner.uid,
                anchors: ["Bottom", "Bottom"],
                paintStyle: {lineWidth: 5, strokeStyle: 'blue'},
                joinStyle: "round",
                endpointStyle: {fillStyle: 'blue', radius: 7},
                connector: ["Flowchart", {cornerRadius: 5}]
            });
        });
    });
};


//-- Main: --------------------------------------------------------------------

// your jsPlumb related init code goes here
jsPlumb.ready( initialLoad );

