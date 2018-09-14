
//-- Variable definitions: ----------------------------------------------------

let loop=0;
let nodes = [];
let namespaces = [];
let services = [];
let deployments = [];
let replicasets = [];
let pods = [];
let ids_seen = [];
let configHash='';
let force_redraw=false;

let kube_version=undefined;

//-- Constant definitions: ----------------------------------------------------

const debug=false;
const debug_toplevel=true; // show calls to getClusterState, setTimeout, drawAll
const debug_nodes=false;
const debug_nodesstatus=false;
const debug_services=false;
const debug_deploys=false;
const debug_replicasets=false;
const debug_pods=false;
const debug_connects=true;
const debug_colors=false;
const enable_connects=false; // Needs placement debugging !

const debug_log  = (msg) => { if (debug)          console.log("debug: " + msg); }
const debug_TOP  = (msg) => { if (debug_toplevel)  console.log("debug_TOP: " + msg); }
const debug_node = (msg) => { if (debug_nodes)    console.log("debug_node: " + msg); }
const debug_nodestatus = (msg) => { if (debug_nodesstatus) console.log("debug_nodestatus: " + msg); }
const debug_svc  = (msg) => { if (debug_services) console.log("debug_service: " + msg); }
const debug_dep  = (msg) => { if (debug_deploys)  console.log("debug_deploy: " + msg); }
const debug_rs   = (msg) => { if (debug_replicasets) console.log("debug_replicaset: " + msg); }
const debug_pod  = (msg) => { if (debug_pods)     console.log("debug_pod: " + msg); }
const debug_connect = (msg) => { if (debug_connects) console.log("debug_connect: " + msg); }
const debug_color   = (msg) => { if (debug_colors)   console.log("debug_color: " + msg); }

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


const createElemDiv = (classes, object, text, x, y, tooltip, fg, bg) => {
    return startElemDiv(classes, object, text, x, y, tooltip, fg, bg) + ' </div>';
}

const startElemDiv = (classes, object, text, x, y, tooltip, fg, bg) => {
    // create string <div> element

    let  type_info='';

    // First class is the type:
    let type=classes.split(" ")[0];

    if (include_type) {
        if (type == 'node') {
            type_info="Node: ";
        } else if (type == 'service') {
            type_info="Svc: ";
        } else if (type == 'deployment') {
            type_info="Dep: ";
        } else if (type == 'replicaset') {
            type_info="Rs: ";
        } else if (type == 'pod') {
            type_info="";
        } else {
            type_info=capitalize1stChar(type)+': ';
        }
    }

    const uid=object.metadata.uid;
    const name=object.metadata.name;
    if (tooltip != '') {
        tooltip=`${name}[uid:${uid}] ` + tooltip;
    } else {
        tooltip=`${name}[uid:${uid}]`;
    }

    color_style=''
    if (fg != undefined) { color_style+='color: ' + fg + ';'; }
    if (bg != undefined) { color_style+='background-color: ' + bg + ';'; }

    debug_color(`fg: ${fg} bg:${bg}`);
    itemSeenIdx = indexOfUIDInList(ids_seen, uid);
    if (itemSeenIdx != -1) {
        die("id seen already: " + uid);
    }
    ids_seen.push( uid );

    //const stElemDiv=`<div id="${uid}" class="${classes} tooltip" data-tip="${tooltip}" style="left: ${x};top: ${y};${color_style}" > ${type_info}${text}`;
    if (color_style == '') {
        stElemDiv=`<div id="${uid}" class="${classes} tooltip" data-tip="${tooltip}" > ${type_info}${text}`;
    } else {
        stElemDiv=`<div id="${uid}" class="${classes} tooltip" data-tip="${tooltip}" style="${color_style}" > ${type_info}${text}`;
    }


    if (type == 'node') {
        debug_node(stElemDiv+' </div>');
    } else if (type == 'service') {
        debug_svc(stElemDiv+' </div>');
    } else if (type == 'deployment') {
        debug_dep(stElemDiv+' </div>');
    } else if (type == 'replicaset') {
        debug_rs(stElemDiv+' </div>');
    } else if (type == 'pod') {
        debug_pod(stElemDiv+' </div>');
    } else {
        debug_log(stElemDiv+' </div>');
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
        configHash += pod.status.phase
    // todo state ??:
    });

    if (configHash == oldConfigHash) {
        debug_TOP('detectChanges: NO-REDRAW');
        //console.log(`detectChanges: NO-REDRAW configHash=${configHash} == ${oldConfigHash}`);
        return false;
    }

    debug_TOP('detectChanges: REDRAW');
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

    debug_TOP(`getClusterState: using namespace ${namespace}`);
    setPaths(namespace);

    const firstReq=jQuery.now();
    let requests = [ ]

    const getnodes=true;
    const getns=true;
    const getservices=true;
    const getdeploys=true;
    const getrs=true;
    const getpods=true;

    ids_seen = [];

    nodes = [];
    namespaces = [];
    deployments = [];
    replicasets = [];
    pods = [];
    services = [];

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

    debug_log(window.namespace);
    debug_log(namespace);

    // force cluster update:
    getClusterState();
    force_redraw=true;
};

const buildNamespaceMenu = (namespaces) => {
    let namespaceList=[];
    let nsMenu='<select class="col dropbtn" id="nsmenu" onchange="changeNamespace();" >';

    namespaces.forEach( (option_namespace, index) => {
        //debug_log(`option_namespace[${index}]: ${option_namespace.metadata.name}`);
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
            //debug_log("MASTER=" + index);
        }
    });

    if (masterIdx == undefined) {
        console.log("Failed to detect Master node");
    }
    // debug_log(`MASTER=node[${masterIdx}]=${master.metadata.name}'`);

    return [masterIdx, master.metadata.name];
};

const getNodeIndex = (nodes, nodeName) => {
    var nodeIndex = -1;

    nodes.forEach( (node, index) => {
        if (node.metadata.name == nodeName) {
            //debug_log(`${node.metadata.name} == ${nodeName}`);
            nodeIndex = index;
        }
        //debug_log(`${node.metadata.name} != ${nodeName}`);
    });

    //debug_log(nodeIndex);
    if (nodeIndex != -1) {
        return nodeIndex;
    }

    die(`Failed to find node <${nodeName}> in list`);
    return -1;
};

const createDeploymentDiv = (object) => {
    let replicas=`${object.status.readyReplicas}/${object.spec.replicas}`;
    let objectText=`${object.metadata.name} [${replicas}]`;
    if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }

    let labels=getLabelsAnnotations(object);
    let tooltip=`${labels}`;
    let x=0;
    let y=0;

    objectDiv = createElemDiv("deployment col", object, objectText, x, y, tooltip);
    return objectDiv;
};

const createReplicaSetDiv = (object) => {
    let replicas = object.spec.replicas;
    let objectText=`${object.metadata.name}[${replicas}]`;
    if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }

    let labels=getLabelsAnnotations(object);
    let tooltip=`${labels}`;
    let x=0;
    let y=0;

    if (replicas == 0) {
        fg='black';
        bg='gray';
        debug_color(`[rs replicas=0] fg: ${fg} bg:${bg}`);
        objectDiv = createElemDiv("replicaset col", object, objectText, x, y, tooltip, fg, bg);
    } else {
        debug_color(`[rs replicas=${replicas}] fg: undefined, bg: undefined`);
        objectDiv = createElemDiv("replicaset col", object, objectText, x, y, tooltip);
    }


    return objectDiv;
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
            debug_log("Visualization paused");
        } else {
            debug_log("Visualization restarted");
            setTimeout(getClusterState, getClusterState_timeout);
        };
    });

    showKubeCompButton.addEventListener('click', (e) => {
        show_kube_components = !show_kube_components;
        if (show_kube_components) {
            debug_log("Show Kubernetes Components");
        } else {
            debug_log("Hide Kubernetes Components");
        };
     });

    var ALL_info=''
    var nodeDivText=[];

    // Determine which is the (only) Master node:
    const retList = getMasterIndex(nodes);
    let masterIdx = retList[0];
    let masterNode = retList[1];
    debug_node(`MASTER=node[${masterIdx}]=${masterNode}'`);

    nodes.forEach( (node, index)      => {
        //let y=1000*index;
        let y=0*index;
        let x=0; //100*index;

        nodeDivText[index]='';

        name = node.metadata.name;
        role = 'worker';
        if (index == masterIdx) {
            name = '<b>*<u>' + node.metadata.name + '</u>*</b>';
            role = 'master';
        }

        nodeDivText[index]+='<i>' + name + '</i>';
        tooltip=''
        nodeDivText[index] = startElemDiv("node", node, nodeDivText[index], x, y, tooltip);
        //if (index != masterIdx) {
        nodeDivText[index] += '<p style="padding: 0px; margin: 5px;" />'; /* TODO: REMOVE THIS HACK - learn to do CSS layouts properly! */
        //}

        // Used for correct pod placement on a row:
        node.lastPodImage=undefined;
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

            // spec: { ports: [ { protocol: 'TCP', port: 5000, targetPort: 5000, nodePort: 31896 } ],
            ports_info='PORTS: ';
            node_port=undefined;
            service.spec.ports.forEach( (port, index) => {
                ports_info+=$.param( port, true);
                if (port.nodePort) { node_port=port.nodePort; }
            });

            tooltip=`${ports_info}  ${labels}`;
            svcDiv = '';

            svcDiv += '<div>';
            label = service.metadata.name;
            if (node_port != undefined) {
                label += '[' + node_port + ']';
            }
            svcDiv += createElemDiv("service", service, label, x, y, tooltip);
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
                                        replicasets_seen.push( replicaset.metadata.uid );
                                        svcDiv += createReplicaSetDiv(replicaset);
                                        debug_svc(`${replicaset.metadata.name}: [${replicaset.spec.replicas}] ${deployment.metadata.name} == ${owner.name}`);
                                    }
                               });
                         }
                      });
                   }
                }
            });

            svcDiv += '</div>';
            svcDiv += '<br/>';
            services_info+=svcDiv;
            debug_svc(`services_info='${services_info}'`);
            debug_svc(`service[${index}]: ${service.metadata.name}`);
        }
     } );
     nodeDivText[masterIdx]+=services_info;

     deploys_info='';
     deployments.forEach( (deployment, index) => {
         // let y=100+100*index;
         let y=0;
         let x=110; //100*index;

         itemSeenIdx = indexOfUIDInList(deploys_seen, deployment.metadata.uid);
         debug_dep(`${itemSeenIdx} ${deployment.metadata.uid}`);
         //debug_dep(`${itemSeenIdx} ` + $.param( deployment.metadata, true));

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
        // debug_dep(`deployment[${index}]: ${deployment.metadata.name}`);
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
                 replicasets_info += createReplicaSetDiv(replicaset);
             }
         }
         // debug_rs(`replicaset[${index}]: ${replicaset.metadata.name}`);
     } );
     nodeDivText[masterIdx]+=replicasets_info;

     x = 0;
     y = 0;

     debug_pod(`#pods=${pods.length}`);
     pods.forEach( (pod, index) => {
         debug_pod(`pod[${index}]: ${pod.metadata.name}`);
         podText = pod.metadata.name;
         x += 100;
         loop++;

         debug_pod( `${pod.metadata.uid} - ${pod.metadata.name} on ${pod.spec.nodeName}` );

         tooltip='';

         image=pod.spec.containers[0].image
         fg=undefined;
         bg=undefined;
         // pod.status.phase = "Error";
         if ( pod.status.phase == "Running" ) {
             // color based on style, label color or version ...
             fg='black';
             if ((image.indexOf(":1") != -1) || (image.indexOf(":v1") != -1)) {
                 bg='#4f4';
	     } else if ((image.indexOf(":2") != -1) || (image.indexOf(":v2") != -1)) {
                 bg='#aa4';
	     } else if ((image.indexOf(":3") != -1) || (image.indexOf(":v3") != -1)) {
                 bg='#4b4';
	     } else if ((image.indexOf(":4") != -1) || (image.indexOf(":v4") != -1)) {
                 bg='#4b8';
	     } else if ((image.indexOf(":5") != -1) || (image.indexOf(":v5") != -1)) {
                 bg='#48b';
	     } else if (image.indexOf(":latest") != -1) {
                 fg='green';
                 bg='#4a4';
             } else {
                 bg='#44f';
             }
         } else if ( pod.status.phase == "Error" ) {
             fg='red';
             bg='pink';
         } else if ( pod.status.phase == "Pending" ) {
             fg='black';
             bg='orange';
         } else if ( pod.status.phase == "Container Creating" ) {
             fg='black';
             bg='yellow';
         } else {
             // ????
             console.log(`Unknown ${pod.status.phase} seen`);
             fg='orange';
             bg='pink';
         }

         debug_color(`[image ${image}][${pod.status.phase}] fg: ${fg} bg:${bg}`);
         nodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
         debug_pod(`${pod.metadata.name} is '${pod.status.phase}' on node[${nodeIndex}] '${pod.spec.nodeName}'`);

         classes="pod"
         if (nodes[nodeIndex].lastPodImage == undefined) {
            classes += " row";
         } else if (nodes[nodeIndex].lastPodImage == image) {
            classes += " col";
         }
         podDiv = createElemDiv(classes, pod, podText, x, y, tooltip, fg, bg);

         nodes[nodeIndex].lastPodImage=image;
         const pod_info = podDiv;


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
         debug_log('NO timeout set - stopping');
     } else {
         debug_log(`setTimeout=${getClusterState_timeout}`);
         setTimeout(getClusterState, getClusterState_timeout);
     }
};

const initialLoad = () => {
    // Initial jsPlumb load

    debug_log("LOAD @ " + jQuery.now());
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
    debug_TOP("redrawAll @ " + jQuery.now());

    $('#cluster').append(info);
    if (! enable_connects) {
        return;
    }

    // Connect pods to their ReplicaSet:
    pods.forEach( (pod, index) => {
        owners = pod.metadata.ownerReferences;
        owners.forEach( (owner, index) => {

            //ownerReference
            //[{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'redis', uid: 'f8134aa4-b534-11e8-8a06-525400c9c704', controller: true, blockOwnerDeletion: true }]
            // debug_connect( $.param( owner, true) );
            debug_connect(`jsPlumb.connect( source[pod/${pod.metadata.name}]: ${pod.metadata.uid}, target[${owner.kind}/${owner.name}]: ${owner.uid} );`);

            var common = {                                                                               
                connector: ["Straight"],                                                                 
                //anchor: ["Left", "Right"],                                                               
                endpoint:"Dot",                                                                          
                                                                                                                     
                paintStyle:{ stroke:"darkblue", strokeWidth:1,  },                                      
                endpointStyle:{ fill:"darkblue", outlineStroke:"darkblue", strokeWidth:0, outlineWidth:0 },           
                                                                                                                     
                //overlays:[ ["Arrow" , { width:12, length:12, location:0.67 }] ],                         
                };                                                                                           

            jsPlumb.connect({
                source: pod.metadata.uid,
                target: owner.uid,}, common);

            /*jsPlumb.connect({
                source: pod.metadata.uid,
                target: owner.uid,
                anchors: ["Bottom", "Bottom"],
                paintStyle: {lineWidth: 5, strokeStyle: 'blue'},
                joinStyle: "round",
                endpointStyle: {fillStyle: 'blue', radius: 7},
                connector: ["Flowchart", {cornerRadius: 5}]
            });*/
        });
    });

    //die("Check connections");
};


//-- Main: --------------------------------------------------------------------

// your jsPlumb related init code goes here
jsPlumb.ready( initialLoad );

