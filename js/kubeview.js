
//-- Variable definitions: ----------------------------------------------------

let loop=0;
let nodes = [];
let namespaces = [];
let services = [];
let deployments = [];
let replicasets = [];
let pods = [];
let ids_seen = [];
let ids_seen_type = [];
let ids_seen_name = [];
let configHash="";
let force_redraw=false;

let rootURL="";

const protocol=window.location.protocol;
const hostname=window.location.hostname;
const port=window.location.port;

var script_tag = document.getElementById('kubeview')
var apiurl = script_tag.getAttribute("data-apiurl");
rootURL=`${protocol}://${hostname}:${port}`;
	
if (typeof apiurl != "undefined") {
    rootURL=apiurl
}

console.log(`Using rootURL '${rootURL}'`);

//import 'js/icon_mappings.js';

var icon_mappings={
    //'redis': 'images/icons/redis.svg'
    'redis':    'redis.svg', 'redis-commander': 'redis-commander.svg',
    'flask':    'flask.svg',
    'flask-app':    'flask.svg',
    'angular':  'angular.svg',
    'react':    'react.svg',
    'nginx':    'nginx.svg',
    'guestbook': 'guestbook.svg',
};



let handlerList = [];

let getversion=true; /* Once only */

let kube_version=undefined;

const stayingAlive  = true; /* Be permissive and never die !! */
const allowNoMaster = true; /* Needed for managed platforms such as AKS */

let imagev1bgcolor = undefined;
let imagev2bgcolor = undefined;
let imagev3bgcolor = undefined;
let imagev4bgcolor = undefined;
let imagev5bgcolor = undefined;
let imagevLATESTbgcolor = undefined;
let imagevDEFAULTbgcolor = undefined;

let statusErrorFgColor = undefined;
let statusErrorBgColor = undefined;
let statusPendingFgColor = undefined;
let statusPendingBgColor = undefined;
let statusCreatingFgColor = undefined;
let statusCreatingBgColor = undefined;
let statusUnknownFgColor = undefined;
let statusUnknownBgColor = undefined;

//-- Constant definitions: ----------------------------------------------------

const debug=false;
const debug_toplevel=false; // show calls to getClusterState, setTimeout, drawAll
const debug_nodes=false;
const debug_nodesstatus=false;
const debug_services=false;
const debug_deploys=false;
const debug_replicasets=false;
const debug_pods=false;
const debug_connects=true;
const debug_colors=false;
const enable_connects=false; // Needs placement debugging !

const debug_log  = (msg) => { if (debug)          console.log("debug: " + msg); };
const debug_TOP  = (msg) => { if (debug_toplevel)  console.log("debug_TOP: " + msg); };
const debug_node = (msg) => { if (debug_nodes)    console.log("debug_node: " + msg); };
const debug_nodestatus = (msg) => { if (debug_nodesstatus) console.log("debug_nodestatus: " + msg); };
const debug_svc  = (msg) => { if (debug_services) console.log("debug_service: " + msg); };
const debug_dep  = (msg) => { if (debug_deploys)  console.log("debug_deploy: " + msg); };
const debug_rs   = (msg) => { if (debug_replicasets) console.log("debug_replicaset: " + msg); };
const debug_pod  = (msg) => { if (debug_pods)     console.log("debug_pod: " + msg); };
const debug_connect = (msg) => { if (debug_connects) console.log("debug_connect: " + msg); };
const debug_color   = (msg) => { if (debug_colors)   console.log("debug_color: " + msg); };

//const debug_loops=1;
//const debug_loops=0;
//var debug_loops=1;
var pause_visu           = { state: false };
var show_kube_components = { state: false };
var enable_tooltips      = { state: false };

const debug_timing=false;

// Include type prefix in displayed element names, e.g. 'Service: <service-name>':
const include_type=true;

//-- Configuration definitions: -----------------------------------------------

//const getClusterState_timeout = 5000;
const active_getClusterState_timeout = 3000;
const idle_getClusterState_timeout = 1000;
let getClusterState_timeout = active_getClusterState_timeout;

var namespace="default";

const version_path="/version";
const nodes_path="/api/v1/nodes";
const namespaces_path="/api/v1/namespaces";

let ingresscontrollers_path=undefined;
let services_path=undefined;
let deployments_path=undefined;
let replicasets_path=undefined;
let pods_path=undefined;


//-- Function definitions: ----------------------------------------------------

const capitalize1stChar = (word) => { let tmp=word; return tmp.replace(/^\w/, c => c.toUpperCase()); };

// async function mysleep(ms) { await sleep(ms); }

// function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const die = (msg) => {
    if (stayingAlive) {
        console.log("error: " + msg);
    } else {
        console.log("die: " + msg);
        throw "";
    }

    console.log("To restart enter in console: 'pause_visu.state=false;'");
     pause_visu.state=false;
	//TODO: reenable
    // pause_visu.state=true;
    //mysleep(10000);
};

const setPaths = (namespace) => {
    // set API paths based on current namespace:

    services_path    = "/api/v1/namespaces/" + namespace + "/services";
    pods_path        = "/api/v1/namespaces/" + namespace + "/pods";
    deployments_path = "/apis/apps/v1/namespaces/" + namespace + "/deployments";
    replicasets_path = "/apis/apps/v1/namespaces/" + namespace + "/replicasets";
};


const createElemDiv = (classes, object, text, x, y, tooltip, fg, bg) => {
    return startElemDiv(classes, object, text, x, y, tooltip, fg, bg) + " </div> " + `<!-- createElemDiv ${classes} -->`;
};

const startElemDiv = (classes, object, text, x, y, tooltip, fg, bg) => {
    // create string <div> element

    let  type_info="";

    // First class is the type:
    let type=classes.split(" ")[0];

    if (include_type) {
        if (type == "node") {
            type_info="Node: ";
        } else if (type == "service") {
            type_info="<b>Service:</b> ";
            //type_info='';
            //console.log(`SERVICE TEXT ${text}`)
        } else if (type == "deployment") {
            type_info="Deploy: ";
        } else if (type == "replicaset") {
            type_info="RS: ";
            //type_info="";
        } else if (type == "pod") {
            type_info="";
        } else {
            type_info=capitalize1stChar(type)+": ";
        }
    }

    const uid=object.metadata.uid;
    const name=object.metadata.name;
    tooltip=`${type}
    ${name}
    
    [uid:${uid}]

${tooltip}`;

    color_style="";
    if (fg != undefined) { color_style+="color: " + fg + ";"; }
    if (bg != undefined) { color_style+="background-color: " + bg + ";"; }

    //debug_color(`fg: ${fg} bg:${bg}`);
    itemSeenIdx = indexOfUIDInList(ids_seen, uid, 'checking ids_seen', true);
    if (itemSeenIdx != -1) {
        die(`${type}: id <${uid}> name <${name}> already seen (with type ${ids_seen_type[itemSeenIdx]}, name ${ids_seen_name[itemSeenIdx]})`);
    }
    ids_seen.push( uid );
    ids_seen_type.push( type );
    ids_seen_name.push( name );

    classes += " tooltip";
    let datatip = " data-tip=\"\"";
    if ( enable_tooltips.state ) {
        datatip = ` data-tip="${tooltip}"`;
    }

    //const stElemDiv=`<div id="${uid}" class="${classes} tooltip" data-tip="${tooltip}" style="left: ${x};top: ${y};${color_style}" > ${type_info}${text}`;
    if (color_style == "") {
        stElemDiv=`<div id="${uid}" class="${classes}" ${datatip} > ${type_info}${text}`;
    } else {
        stElemDiv=`<div id="${uid}" class="${classes}" ${datatip} style="${color_style}" > ${type_info}${text}`;
    }
    //stElemDiv=`<div id="${uid}" class="${classes}" ${datatip} style="${color_style}" > ${type_info}${text}`;

    if (type == "node") {
        debug_node(stElemDiv+" </div>"); // Why </div> ????
    } else if (type == "service") {
        debug_svc(stElemDiv+" </div>");
        //console.log(stElemDiv+' </div>');
    } else if (type == "deployment") {
        debug_dep(stElemDiv+" </div>");
    } else if (type == "replicaset") {
        debug_rs(stElemDiv+" </div>");
    } else if (type == "pod") {
        debug_pod(stElemDiv+" </div>");
    } else {
        debug_log(stElemDiv+" </div>");
    }

    return stElemDiv;
};

const detectChanges = () => {

    let oldConfigHash=configHash;

    configHash="";

    configHash += enable_tooltips.state;
    configHash += show_kube_components.state;

    nodes.forEach( (node, index) => {
        configHash += node.metadata.uid;
    // todo state:
    });
    configHash += namespaces.join(",");

    services.forEach( (service, index) => {
        configHash += service.metadata.uid;
    // todo state ??:
    });
    deployments.forEach( (deploy, index) => {
        configHash += deploy.metadata.uid;
    // todo state ??:
    });
    replicasets.forEach( (replicaset, index) => {
        configHash += replicaset.metadata.uid;
    // todo state ??:
    });
    pods.forEach( (pod, index) => {
        configHash += pod.metadata.uid;
        configHash += pod.status.phase;
    // todo state ??:
    });

    if (configHash == oldConfigHash) {
        debug_TOP("detectChanges: NO-REDRAW");
        //console.log(`detectChanges: NO-REDRAW configHash=${configHash} == ${oldConfigHash}`);
        return false;
    }

    debug_TOP("detectChanges: REDRAW");
    //console.log(`detectChanges: REDRAW configHash=${configHash} != ${oldConfigHash}`);
    //console.log(`#nodes=${nodes.length}`);

    return true;
};

const getHTMLLabelsAnnotations = (object) => {
    let retStr="";

    retStr += "<ul>";

    if (object.metadata.labels) {
        retStr += "<h3>Labels</h3>";
        Object.keys(object.metadata.labels).forEach( (key, index) => {
            value = object.metadata.labels[key];
            retStr += `<li>${key} - ${value}</li>`;
	});
    }

    if (object.metadata.annotations) {
        retStr += "<h3>Annotations</h3>";
        Object.keys(object.metadata.annotations).forEach( (key, index) => {
            value = object.metadata.annotations[key];
            retStr += `<li>${key} - ${value}</li>`;
	});
    }

    retStr += "</ul>";
    return retStr;
};

const getLabelsAnnotations = (object, html) => {
    let retStr="";

    // console.log( $.param( object.metadata.labels, true) );

    if (object.metadata.labels) {
        retStr += "\n    Labels: " + $.param( object.metadata.labels, true);
    };

    if (object.metadata.annotations) {
        retStr += "\n    Annotations: " + $.param( object.metadata.annotations, true);
    };

    return retStr;
};

const getClusterState = () => {
    // interrogate API for clusterState

    handlerList = [];

    let def = $.Deferred();

    debug_TOP(`getClusterState: using namespace ${namespace}`);
    console.log(`Using rootURL '${rootURL}'`);
    setPaths(namespace);

    const firstReq=jQuery.now();
    let requests = [ ];

    const getnodes=true;
    const getns=true;
    const getservices=true;
    const getdeploys=true;
    const getrs=true;
    const getpods=true;


    ids_seen = [];
    ids_seen_type = [];
    ids_seen_name = [];
    nodes = [];
    namespaces = [];
    deployments = [];
    replicasets = [];
    pods = [];
    services = [];

    if ( getversion ) {
        const versionReq = $.getJSON(rootURL + version_path, (obj) => {
            kube_version=obj.gitVersion;
	    console.log(`GOT kube_version[git]=${kube_version}`);
	});
        requests.push(versionReq);
        getversion=false; /* Once only */
    }
    if ( getnodes ) {
        const nodesReq = $.getJSON(rootURL + nodes_path, (obj) => {
            if (obj.items == undefined) { return; }
            nodes = obj.items; nodes.forEach( (item) => { item.kind="node";} ); });
        requests.push(nodesReq);
    }
    if ( getns ) {
        const namespacesReq = $.getJSON(rootURL + namespaces_path, (obj) => {
            if (obj.items == undefined) { return; }
            namespaces=obj.items; namespaces.forEach( (item) => { item.kind="namespace";} ); });
        requests.push(namespacesReq);
    }
    if ( getservices ) {
        const servicesReq   = $.getJSON(rootURL + services_path,   (obj) => {
            if (obj.items == undefined) { return; }
            services=obj.items; services.forEach( (item) => { item.kind="service";} ); });
        requests.push(servicesReq);
    }
    if ( getdeploys ) {
        const deploymentsReq   = $.getJSON(rootURL + deployments_path,   (obj) => {
            if (obj.items == undefined) { return; }
            deployments=obj.items; deployments.forEach( (item) => { item.kind="deployment";} ); });
        requests.push(deploymentsReq);
    }
    if ( getrs ) {
        const replicasetsReq   = $.getJSON(rootURL + replicasets_path,   (obj) => {
            if (obj.items == undefined) { return; }
            replicasets=obj.items; replicasets.forEach( (item) => { item.kind="replicaset";} ); });
        requests.push(replicasetsReq);
    }
    if ( getpods ) {
        const podsReq   = $.getJSON(rootURL + pods_path,   (obj) => {
            if (obj.items == undefined) { return; }
            pods=obj.items; pods.forEach( (item) => { item.kind="pod";} ); });
        requests.push(podsReq);
    }

    const lastReq=jQuery.now();

    $.when.apply( $, requests ).done( () => {

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
    let nsMenu="<select class=\"col dropbtn\" id=\"nsmenu\" onchange=\"changeNamespace();\" >";

    namespaces.forEach( (option_namespace, index) => {
        //debug_log(`option_namespace[${index}]: ${option_namespace.metadata.name}`);
        let selected="";
        if (option_namespace.metadata.name == namespace) {
            selected=" selected=\"selected\"";
        }

        nsMenu += `<option value="${option_namespace.metadata.name}" ${selected}> ${option_namespace.metadata.name} </option>`;
        namespaceList.push(option_namespace.metadata.name);
    } );

    nsMenu += "</select>";
    return nsMenu;
};


const getMasterIndex = (nodes) => {
    let masterIdx=undefined;

    nodes.forEach( (node, index)      => {
        //console.log(`NODE-NAME: <${node.metadata.name}>`);
        if ("node-role.kubernetes.io/master" in node.metadata.labels) {
            masterIdx=index;
            master=nodes[index];
            //console.log("MASTER ROLE FOUND" + index);
            debug_log("MASTER=" + index);

            // Note: This will not return from forEach (try 'same' for that):
            //       but important is that these variables are set
            return [masterIdx, master.metadata.name];
        }
        /* if (node.metadata.name == "docker-for-desktop") {
            masterIdx=index;
            master=nodes[index];
            //console.log(`MASTER IDX=${index} NODE-NAME: <${node.metadata.name}>`);
            console.log("Docker-for-desktop name FOUND" + index);
            debug_log("MASTER=" + index);
        } */
    });

    if (masterIdx == undefined) {
        if (!allowNoMaster) {
            //console.log("Failed to detect Master node");
            die("Failed to detect Master node");
        }
        return [undefined,undefined];
    }
    //console.log(`MASTER=node[${masterIdx}]=${master.metadata.name}'`);
    debug_log(`MASTER=node[${masterIdx}]=${master.metadata.name}'`);

    return [masterIdx, master.metadata.name];
};

const getNodeIndex = (nodes, nodeName) => {
    var nodeIndex = -1;

    //nodes.forEach( (node, index) => { console.log("INDEX=" + index); });
    nodes.forEach( (node, index) => {
        if (node.metadata.name == nodeName) {
            //debug_log(`${node.metadata.name} == ${nodeName}`);
            nodeIndex = index;
        }
        //debug_log(`${node.metadata.name} != ${nodeName}`);
    });

    //debug_log(nodeIndex);
    if (nodeIndex != -1) {
	//console.log("RETURN INDEX=" + nodeIndex);
        return nodeIndex;
    }

    //die(`Failed to find node <${nodeName}> in list`);
    return -1;
};

const createDeploymentDiv = (object, embed) => {
    let replicas=`${object.status.readyReplicas}/${object.spec.replicas}`;
    let replicasForModal=`${object.status.readyReplicas} present/${object.spec.replicas} desired`;

    //let objectText=`${object.metadata.name} [${replicas}]`;
    //if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }
    let objectText=`${replicas}* ${object.metadata.name}`;
    if (object.metadata.labels.run) { objectText=`${replicas}* ${object.metadata.labels.run}`; }

    let tooltip="";
    let x=0;
    let y=0;

    const objectDiv = createElemDiv("deployment col", object, objectText, x, y, tooltip);
    //return objectDiv;
    const content=` <br/> <b>Replicas</b>: ${replicasForModal} ` + embed;

    const modalDiv = createModalText("Deployment", object, objectDiv, object.metadata.uid, content);
    return modalDiv;
};

const getIconImgTag = (object) => {
    let run = '';
    if (object.metadata.labels.run) { run = object.metadata.labels.run; }
    else if (object.metadata.labels.app) { run = object.metadata.labels.app; }
    
    //console.log('run='+run)

    if (!icon_mappings[run]) {
        //console.log('NO RUN LABEL for ' + object.metadata.name);
        return '';
    };

    const iconImgTag='<img width="30" height="30" src="images/icons/' + icon_mappings[run] + '" />';
    //console.log(iconImgTag)
    return iconImgTag
};

/*
inspect(body):
{ kind: 'Service',
  apiVersion: 'v1',
  metadata:
   { name: 'fancypants',
     namespace: 'default',
     selfLink: '/api/v1/namespaces/default/services/fancypants',
     uid: '711afd87-bd8c-11e8-b8b2-d6f27a9f8bb3',
     resourceVersion: '15563',
     creationTimestamp: '2018-09-21T10:52:32Z',
     annotations:
      { 'kubectl.kubernetes.io/last-applied-configuration': '{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"fancypants","namespace":"default"},"spec":{"ports":[{"port":80}],"selector":{"app":"fancypants"},"type":"LoadBalancer"}}\n' } },
  spec:
   { ports:
      [ { protocol: 'TCP', port: 80, targetPort: 80, nodePort: 30696 } ],
     selector: { app: 'fancypants' },
     clusterIP: '10.0.143.85',
     type: 'LoadBalancer',
     sessionAffinity: 'None',
     externalTrafficPolicy: 'Cluster' },
  status: { loadBalancer: { ingress: [ { ip: '137.117.192.44' } ] } } }
*/

const createServiceDiv = (object, embed) => {
    // spec: { ports: [ { protocol: 'TCP', port: 5000, targetPort: 5000, nodePort: 31896 } ],
    ports_info="PORTS: ";
    node_port=undefined;
    object.spec.ports.forEach( (port, index) => {
        ports_info+=$.param( port, true);
        if (port.nodePort) { node_port=port.nodePort; }
    });

    let objectText=`${object.metadata.name}`;
    if (object.metadata.labels && object.metadata.labels.run) {
        objectText=`${object.metadata.labels.run}`;
    }
    //if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }

    let tooltip="";
    let x=0;
    let y=0;

    // console.log(`service ${object.metadata.name}: node_port ${node_port}`)

    if (node_port != undefined) {
        // console.log(`service ${object.metadata.name}: NODE_PORT ${node_port}`)
        // objectText += ' [NodePort: ' + node_port + ']';
        objectText += " [" + node_port + "]";
        tooltip += `NodePort: ${node_port}`;
    }

    const content="";
    const objectDiv = "<div>" +
        createElemDiv("service", object, getIconImgTag(object) + objectText + '<hr/>' + embed, x, y, tooltip);
    modalDiv = createModalText("Service", object, objectDiv, objectText, content);

    return modalDiv;
};

const show_pods_seen = (label)    => { if (label === undefined) label = ""; if (label != "") label=`[${label}]`; showSeen(`pod${label}`,    pods_seen); };
const show_deploys_seen = (label) => { if (label === undefined) label = ""; if (label != "") label=`[${label}]`; showSeen(`deploy${label}`, deploys_seen); };
const show_rs_seen = (label)      => { if (label === undefined) label = ""; if (label != "") label=`[${label}]`; showSeen(`rs${label}`,     rs_seen); };

const showSeen = (object_type, seen_hash) => {
    console.log(`${object_type}s_seen[${seen_hash.length}]=${seen_hash}`);
};

const createReplicaSetDiv = (object) => {
    let replicas = object.spec.replicas;
    let objectText=`${object.metadata.name}`;

    const image=getImage(object);
    const image_version=getImageVersion(object, image);
    if (image_version == undefined) { die("replicaset: undefined image_version"); }

    if (object.metadata.labels.run) {
	objectText=`${object.metadata.labels.run} ${image_version}`;
    };
    //objectText+=`[${replicas}]`;
    objectText=`${replicas}* ${objectText}`;

    let tooltip="";
    let x=0;
    let y=0;

    //classes="replicaset box-outer col";
    //classes="replicaset outter col";
    //objectText='<div class="box-inner">HELLO</div>' + objectText;
    classes="replicaset col";
    if (replicas == 0) {
        fg="black";
        bg="gray";
    } else {
        colors = getObjectColors(object, image, image_version);
        fg=colors[0];
        bg=colors[1];
    }

    debug_color(`[RS COLOR replicas=${replicas}] fg: ${fg} bg:${bg}`);
    objectDiv = createElemDiv(classes, object, objectText, x, y, tooltip, fg, bg);

    const content="";
    const modalDiv = createModalText("replicaset", object, objectDiv, objectText, content);

    return modalDiv;
};

const getType = (object) => {
    if (object.metadata.selfLink) {
        if (object.metadata.selfLink.indexOf("/deployments/") != -1) {
            return "deployment";
        } else if (object.metadata.selfLink.indexOf("/pods/") != -1) {
            return "pod";
        } else if (object.metadata.selfLink.indexOf("/services/") != -1) {
            return "service";
        } else if (object.metadata.selfLink.indexOf("/replicasets/") != -1) {
            return "replicaset";
        } else if (object.metadata.selfLink.indexOf("/nodes/") != -1) {
            return "node";
	}
    }

    return "unknown";
};

const getImage = (object, image) => {

    if (getType(object) == "replicaset") {
        if (!object.spec.template) {
            die("replicaset: no template!");
	}
        if (!object.spec.template.spec.containers) {
            die("replicaset: no template.spec.containers!");
	}
        image=object.spec.template.spec.containers[0].image;
        // debug(`replicaset: ${object.metadata.name}: ${image}`);
    }

    if (object.spec.containers) {
        image=object.spec.containers[0].image;
        return image;
    } else if (object.spec.template && object.spec.template.spec.containers) {
        image=object.spec.template.spec.containers[0].image;
	    //console.log(`RS: ${object.metadata.selfLink}`);
	    //console.log(`RS: ${image}`);
	    //die("OK");
        return image;
    } else {
        return undefined;
    }
    return undefined;
};

const getImageVersion = (object) => {
    let image=getImage(object);
    // debug(`getImage(${object.metadata.name}: ${image}`);
    if (image == undefined) {
        return "";
    }

    let image_version="";
    if ((image.indexOf(":latest") == -1) && (image.indexOf(":") != -1)) {
        //image_version='['+image.substr( 1+image.lastIndexOf(":") )+']';
        image_version=image.substr( 1+image.lastIndexOf(":") );
    }

    return image_version;
};

// TO GET CSS VARIABLES:
//   window.getComputedStyle(document.documentElement).getPropertyValue('--varname');
// TO SET CSS VARIABLES:
//   document.documentElement.style.setProperty('--varname', '#000');
const getCSSVariable = (name) => {
    value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    if (value == undefined) {
        die(`getCSSVariable: failed to get value for CSS property ${name}`);
    }
    return value;
};

const setCSSVariable = (name, value) => {
   document.documentElement.style.setProperty(name, value);
};

const getObjectColors = (object, image, image_version) => {
    let fg=undefined;
    let bg=undefined;
    const phase = object.status.phase;
    const name = object.metadata.name;
    const type=getType(object);

    // phase = "Error";
    let colorBasedOnImage=false;
    if (type == "pod" && phase == "Running") {
        colorBasedOnImage=true;
    }
    if (type == "replicaset") {
        colorBasedOnImage=true;
        // NO phase, debug_color(`RS: ${phase}`);
	    // Use "status": {
	    // "replicas": 4,
	    // "fullyLabeledReplicas": 4,
	    // "readyReplicas": 4,
	    // "availableReplicas": 4,
	    // "observedGeneration": 4
	    // }
    }

    if (colorBasedOnImage) {
        // color based on style, label color or version ...
        fg="black";
        if ((image.indexOf(":1") != -1) || (image.indexOf(":v1") != -1)) {
            bg=imagev1bgcolor;
	} else if ((image.indexOf(":2") != -1) || (image.indexOf(":v2") != -1)) {
            bg=imagev2bgcolor;
	} else if ((image.indexOf(":3") != -1) || (image.indexOf(":v3") != -1)) {
            bg=imagev3bgcolor;
	} else if ((image.indexOf(":4") != -1) || (image.indexOf(":v4") != -1)) {
            bg=imagev4bgcolor;
	} else if ((image.indexOf(":5") != -1) || (image.indexOf(":v5") != -1)) {
            bg=imagev5bgcolor;
	} else if (image.indexOf(":latest") != -1) {
            bg=imagevLATESTbgcolor;
        } else {
            bg=imagevDEFAULTbgcolor;
        }
    } else if ( phase == undefined ) {
	    // not a pod
    } else if ( phase == "Error" ) {
        fg=statusErrorFgColor; bg=statusErrorBgColor;
    } else if ( phase == "ErrImagePull" ) {
        fg=statusErrorFgColor; bg=statusErrorBgColor;
    } else if ( phase == "Failed" ) {
        fg=statusErrorFgColor; bg=statusErrorBgColor;
    } else if ( phase == "UnexpectedAdminissionError" ) {
        fg=statusErrorFgColor; bg=statusErrorBgColor;
    } else if ( phase == "Pending" ) {
        fg=statusPendingFgColor; bg=statusPendingBgColor;
    } else if ( phase == "Container Creating" ) {
        fg=statusCreatingFgColor; bg=statusCreatingBgColor;
    } else if ( phase == "Terminating" ) {
        fg=statusPendingFgColor; bg=statusPendingBgColor;
    } else {
        // ????
        console.log(`Unknown ${phase} seen`);
        fg=statusUnknownFgColor; bg=statusUnknownBgColor;
        die(`Unknown ${phase} seen on ${type}:${name}`);
    }

    if (type == "replicaset") {
      if (colorBasedOnImage) {
        debug_color(`[Based on image, image ${image}][${phase}] fg: ${fg} bg:${bg}`);
      } else {
        debug_color(`[Based on phase, image ${image}][${phase}] fg: ${fg} bg:${bg}`);
      }
    }
    return [fg, bg];
};


const createPodDiv = (object, nodeIndex) => {
    let objectText=`${object.metadata.name}`;
    const image=object.spec.containers[0].image;
    const image_version=getImageVersion(object);
    const num_containers=object.spec.containers.length;

    run_label = get_run_app_label(object);
    if (run_label != '') {
        let more_containers='';
        // if (num_containers > 1) { more_containers=`<b>[${num_containers}]</b> `; }

        // Get end of podId - the unique part ...
        let postfix=objectText.substr(objectText.lastIndexOf("-"));
        if (image_version != '') {
	    objectText=`${more_containers}${run_label}:${image_version}-*${postfix}`;
	} else {
	    objectText=`${more_containers}${run_label}-*${postfix}`;
	}
    }

    let tooltip="";
    let x=0;
    let y=0;

    //x += 100;
    loop++;

    debug_pod( `${object.metadata.uid} - ${object.metadata.name} on ${object.spec.nodeName}` );

    tooltip="";

    colors = getObjectColors(object, image, image_version);
    fg=colors[0];
    bg=colors[1];
    //debug_color(`POD COLOR: fg=${fg} bg=${bg}`);
    //debug_pod(`${object.metadata.name} is '${object.status.phase}' on node[${nodeIndex}] '${object.spec.nodeName}'`);

    classes="pod";
    if (!nodes[nodeIndex]) { // Why would this happen?
        classes += " row";
	console.log(`nodes[${nodeIndex}] is undefined for pod ${object.metadata.name} (nodes.length=${nodes.length})`);
    } else if (nodes[nodeIndex].lastPodImage == undefined) {
        classes += " row";
    } else if (nodes[nodeIndex].lastPodImage == image) {
        classes += " col";
    }
    if (nodes[nodeIndex]) { // Why would this happen?
        nodes[nodeIndex].lastPodImage=image;
    }

    containerBlocksHTML='';
    //object.spec.containers.forEach( (item_id, index) => {}
    object.status.containerStatuses.forEach( (item_id, index) => {
        img='images/icons/yellow_square.svg';
        if (item_id.ready == true) {
            img='images/icons/green_square.svg';
	}
	    /*
        if (item_id.state == "Running") {
            img='images/icons/green_square.svg';
	} else if (item_id.state == "Error") {
            img='images/icons/red_square.svg';
	} else {
            console.log(`container state=${item_id.state}`);
            console.log(object);
            img='images/icons/yellow_square.svg';
        }
	*/
        containerBlocksHTML += `<img src="${img}" width="10" height="10" />`;
    });

    objectText += containerBlocksHTML;
    let objectDiv = createElemDiv(classes, object, objectText, x, y, tooltip, fg, bg);
    //objectDiv += containerBlocksHTML;

    const content="";

    //TODO: Fix use of modal here (BROKEN by adding in containerBlocksHTML)
    //const modalDiv = createModalText("Pod", object, objectDiv, objectText, content);
    const modalDiv =objectDiv;

    return modalDiv;
};

const indexOfUIDInList = (idlist, id, msg, debug) => {
    var foundIdx=-1;
    if (msg === undefined) msg='';
    if (debug === undefined) debug=false;

	debug=false;

    if (debug) console.log(`indexOfUIDInList(list[${idlist.length}], ${id}, "${msg}"`);

    let index=0;
    let matchIndex=-1;
    idlist.some( item_id => {
        if (debug) console.log(`seen ${item_id}`);
        if (item_id == id) {
            if (debug) console.log(`matched ${id}`);
            matchIndex=index;
            return true;
	}
        index=index+1;
    });

    if (matchIndex == -1)
        if (debug) console.log(`failed to match ${id}`);
    return matchIndex;
};

const createCheckBoxText = (id, value, label, checkState) => {
    let checked="";
    if (checkState) { checked="checked='checked'"; }

    let checkBoxDivText=`<div class="col"><input type="checkbox" id="${id}" name="${id}"${checked} value="${value}" /> <label for="${value}">${label}</label></div> <!-- createCheckBoxText -->`;
    /*let showKubeCompButtonText='<div class="col">' +
        '<input type="checkbox" id="show_kubernetes" name="show_kubernetes" ' + checked + ' value="show_all" />' +
        '<label for="show_all">Show Kubernetes components</label>' +
      '</div>';*/

    return checkBoxDivText;
};

const createButtonText = (id, value, label) => {

    //let buttonDivText=`<div class="col"><input type="button" id="${id}" name="${id} value="${value}" /> <label for="${value}">${label}</label></div>`;
    let buttonDivText=`<div class="col "><button class="request_button" id="${id}" name="${id}" value="${value}" > ${label} </button> </div> <!-- createButtonText -->`;

    return buttonDivText;
};

const addCheckBoxHandler = (id, label, checkState_obj, handler) => {
    let checkBox = document.querySelector(`#${id}`);

    if (checkBox == null) {
        console.log(`addCheckBoxHandler: Failed to select id: Adding eventListener/handler to #${id}`);
        return;
    }
    checkBox.addEventListener("click", (e) => {
        checkState_obj.state = !checkState_obj.state;
        debug_log(`Button ${id} clicked, '${label}' state now: ${checkState_obj.state}`);
	handler(id, label, checkState_obj);
    });
};

const addButtonHandler = (id, label, handler) => {
    let button = document.querySelector(`#${id}`);

    if (button == null) {
        console.log(`addButtonHandler: Failed to select id: Adding eventListener/handler to #${id}`);
        return;
    }
    //console.log(`Adding eventListener/handler to #${id}`);
    button.addEventListener("click", (e) => {
        debug_log(`Button ${id} clicked, '${label}'`);
	handler(id, label);
    });
};

const sanitizeName = (name) => {
    return 'b_' + name.replace(/\./g, '_');
};

const createModalText = (type, object, href_content, id, markup) => {

    // const labelsAnnotations = getHTMLLabelsAnnotations(object);
    const labelsAnnotations = "";

    const image = getImage(object);
    let imageText = undefined;

    if (image == undefined) {
        imageText = "";
    } else {
        imageText = `<b>Image</b>: ${image}`;
    }

    let typeSpecific="";

    let selfLink="";
    deleteBUTTON="<p>Cannot Delete (no object.metadata.selfLink)<p/>";
    deleteOUTPUT="";
    if (object.metadata && object.metadata.selfLink) {
        selfLink=`<br/> <b>selfLink</b>:
           <a href="${object.metadata.selfLink}"> ${object.metadata.selfLink}
           </a>`;

        name = sanitizeName( object.metadata.name ); // In case name is in form of ip address, need html compatible div id

        const divid_del_button=name + "_buttonDELETE";
        const divid_del_output=name + "_buttonDELETE_OP";

        deleteBUTTON=createButtonText(divid_del_button, "DELETE", "DELETE");
        deleteOUTPUT=`<div id="${divid_del_output}" class="request_output scroll_auto" > </div> <!-- deleteOP -->`;
        handlerList.push( [ divid_del_button, divid_del_output, (id, label, divid_op) => {
            let def = $.Deferred();
            var hash_divid_output = "#" + divid_op;

            const path = object.metadata.selfLink;
            //console.log("DELETE " + path);

            $.ajax({
                url: path,
                method: 'DELETE',
                contentType: 'application/json',
                success: function(result) {
                    console.log(`DELETEd ${path}`);
                },
                error: function(request, msg, err) {
                    console.log(`FAILED to DELETE ${path}`);
                    console.log(msg);
                    console.log(err);
                }
            });
        }]);
    };

    // http://127.0.0.1:18002/api/v1/namespaces/default/services/flask-app/proxy/
    /*
    * window.location.href returns the href (URL) of the current page
    * window.location.hostname returns the domain name of the web host
    * window.location.pathname returns the path and filename of the current page
    * window.location.protocol returns the web protocol used (http: or https:)
    * window.location.assign loads a new document
    */
    if (getType(object) == "pod") {
        typeSpecific += "<br/> <b>Addresses</b>";

        typeSpecific += `<br/> <b>Host-ip</b>: ${object.status.hostIP}`;
        typeSpecific += `<br/> <b>Pod-ip</b>: ${object.status.podIP}`;
    }

    if (getType(object) == "node") {
        //console.log(`Node modal ${object.metadata.name}`);
        typeSpecific += "<h3>Addresses</h3>";

        Object.keys(object.metadata.annotations).forEach( (key, index) => {
            // Works with flannel at least ...
	    if (key.indexOf("public-ip") != -1) {
                const ip = object.metadata.annotations[key];
                typeSpecific += `<br/> <b>Public-ip</b>: ${ip}`;
	    }
	});

        //typeSpecific += '<ul>';
	object.status.addresses.forEach( (address, index) => {
            //typeSpecific += `<li> ${address.type}: ${address.address} </li>`;
            typeSpecific += `<br/> <b> ${address.type}</b>: ${address.address} </li>`;
	});
        //typeSpecific += '</ul>';
    };

    if (getType(object) == "service") {

        const path = `/api/v1/namespaces/${namespace}/services/${object.metadata.name}/proxy/`;
        const href = `${rootURL}${path}`;

        name = sanitizeName( object.metadata.name ); // In case name is in form of ip address, need html compatible div id

        const divid_button=name + "_buttonGET";
        const divid_output=name + "_buttonGET_OP";


        getBUTTON=createButtonText(divid_button, "GET", "GET");
        getOUTPUT=`<div id="${divid_output}" class="request_output scroll_auto" > </div> <!-- getOP -->`;
        //console.log(`Pushing handler for ${divid_button}//${divid_output}`);

        handlerList.push( [ divid_button, divid_output, (id, label, divid_op) => {

            var hash_divid_output = "#" + divid_op;

            //console.log(`Making GET request to ${path}`);
            //console.trace();
            const serviceGETrequest = $.get(path, (data) => {
                //console.log( "GET gotten ok ;-)");
                //console.log( data );
                size = data.length;
                if ( (data.trim().toLowerCase().indexOf("<!doctype html>") == 0) ||
                     (data.trim().toLowerCase().indexOf("<html>") == 0) ) {
		    console.log(`[${size}by]: Embedding html page content in <iframe> tag in div '${hash_divid_output}'`);
		    //console.log(data);
                    $(hash_divid_output).html( `<iframe srcdoc="${data}" />` );
                 } else if (data.trim().indexOf("<") == 0) {
		    console.log(`[${size}by]: Outputting html content directly in div '${hash_divid_output}'`);
		    //console.log(data);
                    $(hash_divid_output).html( data );
                 } else {
		    console.log(`[${size}by]: Embedding text content in <pre> tag in div '${hash_divid_output}'`);
		    //console.log(data);
                    $(hash_divid_output).html( `<pre> ${data} </pre> in div '${hash_divid_output}` );
                 }
            });

            const requests = [ serviceGETrequest ];
            $.when.apply( $, requests ).done( () => {
                def.resolve();
                //console.log(`[resolved] GET request to ${path}`);
            });
        } ] );

        // console.log(getBUTTON);
        typeSpecific += `<h3>Service Link:</h3> ${getBUTTON}
                      <br/><a href="${path}"> ${href} </a><hr/> ${getOUTPUT} <hr/>`;
    };

    const content=`<h2><u>${type}</u>: ${object.metadata.name}
                 <br/> UID: ${object.metadata.uid}</h2>
                ${imageText}
                ${selfLink} ${deleteBUTTON} ${deleteOUTPUT}
                ${typeSpecific}
                ${labelsAnnotations}
<hr/>
                ${markup}
		`;


    const inspectText=inspect(object, 5);

    const modalText=`
    <a class="modal_href" href="#${id}_modal">${href_content}</a>

    <div id="${id}_modal" class="modalDialog">
      <div>
        <a href="#${id}_close_modal" title="Close" class="close">X</a>
	${content}
        <div class="scroll_auto"> ${inspectText} </div>
      </div>
    </div>
    `;

    return modalText;
};

const inspect = (obj, maxLevels, level) => {
    var str = "", type, msg;

    // Start Input Validations
    // Don't touch, we start iterating at level zero
    if (level == null)  level = 0;

    // At least you want to show the first level
    if (maxLevels == null) maxLevels = 1;
    if (maxLevels < 1)     
        return "<font color=\"red\">Error: Levels number must be > 0</font>";

    // We start with a non null object
    if (obj == null)
        return "<font color=\"red\">Error: Object <b>NULL</b></font>";
    // End Input Validations

    // Each Iteration must be indented
    str += "<ul style=\"list-style: disc outside none;\" >";

    // Start iterations for all objects in obj
    for (var property in obj) {
      try {
          // Show "property" and "string value" if string
          // WAS: Show "property" and "type property"
          type =  typeof(obj[property]);
          if (type == "string") {
              value = obj[property];
              str += "<li> " + property + ( (value==null)?(": <b>null</b>"):(": " + value)) + "</li>";
          } else {
              str += "<li> " + property + ( (value==null)?(": <b>null</b>"):("")) + "</li>";
          }

          // We keep iterating if this property is an Object, non null
          // and we are inside the required number of levels
          if ((type == "object") && (obj[property] != null) && (level+1 < maxLevels))
              str += inspect(obj[property], maxLevels, level+1);
      }
      catch(err) {
          // Are there some properties in obj we can't access? Print it red.
          if (typeof(err) == "string") msg = err;
          else if (err.message)        msg = err.message;
          else if (err.description)    msg = err.description;
          else                        msg = "Unknown";

          str += "<li><font color=\"red\">(Error) " + property + ": " + msg +"</font></li>";
      }
    }

    // Close indent
    str += "</ul>";

    return str;
};

const redrawTopMenu = () => {
    //----- Build up namespace dropdown menu:
    const nsMenu = buildNamespaceMenu(namespaces);

     pause_visu.state=false;
    let runningButtonText = createCheckBoxText( "run_or_pause", "Pause", "Pause", pause_visu.state);

    let tooltipButtonText = createCheckBoxText( "enable_tooltip", "Enable tooltips", "Enable tooltips", enable_tooltips.state);

    let showKubeCompButtonText = createCheckBoxText( "show_kubernetes", "show_all", "Show Kubernetes components", show_kube_components.state);

    if (CLUSTERNAME == null) { CLUSTERNAME='CLUSTERNAME_UNDEFINED'; }
    let toplineMenu=`
	 <div><div class="row" ><b>Cluster Name:</b> <i>${CLUSTERNAME}</i>, <b>Kubernetes:</b><i>${kube_version}</i>, <b>Namespace:</b> </div> <div class="col" > ${nsMenu} </div></div>
         ${runningButtonText} ${tooltipButtonText} ${showKubeCompButtonText}
         &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ${sourceURL}
    `;

    $("#top_menu").empty();
    $("#top_menu").append(toplineMenu);

     pause_visu.state=false;
    addCheckBoxHandler("run_or_pause", "Pause", pause_visu,
        (id, label, checkState) => {
            setTimeout(getClusterState, getClusterState_timeout);
	});

    addCheckBoxHandler("enable_tooltip", "Enable tooltips", enable_tooltips,
        (id, label, checkState) => {
            setTimeout(getClusterState, getClusterState_timeout);
	});

    addCheckBoxHandler("show_kubernetes", "Show Kubernetes components", show_kube_components,
        (id, label, checkState) => { getClusterState(); });

};

const createNode = (node, index, masterIdx, embed_text) => {
        //let y=1000*index;
        let y=0;
        let x=0; //100*index;

        let nodeDivText="";

        const name = node.metadata.name;
        let nameText = name;
        role = "worker";

        if (index == masterIdx) {
            nameText = "<b>*<u>" + name + "</u>*</b>";
            role = "master";
        }

        tooltip="";
        nodeDivText+="<i>" + nameText + "</i>";

        classes="node";
        var ready=true;
        // debug_nodestatus(`${name}: Assuming ready ...`);
        node.status.conditions.forEach( (condition, index) => {
            if (condition.type == "Ready") {
                if (condition.status == "True") {
                    debug_nodestatus(`${name}: Ready...`);
                } else {
                    ready=false;
                    debug_nodestatus(`${name}: Readiness ${condition.status}...`);
                };
                return;
            }
        });

        if (ready && debug_nodesstatus) {
            debug_nodestatus(`${name}: taints: ${node.spec.taints}...`);
            if (node.spec.taints) {
                if (name in node.spec.taints) {
                    debug_nodestatus(`${name}: ${node.spec.taints[name]}...`);
                } else {
                    debug_nodestatus(`${name}: not in taints: ${node.spec.taints}...`);
               }
           }
        }

        if (!ready) {
            classes += " notready";
	} else if (node.spec.taints &&
	           (name in node.spec.taints) &&
		   ( (node.spec.taints[name] == "DoNotSchedulePods") ||
		     (node.spec.taints[name] == "NoExecute") )) {
            classes += " unsched";
            debug_nodestatus(`${name}: Tainted ${node.spec.taints[node.metadata.name]}`);
        } else if ( (index == masterIdx) &&
                    ("node-role.kubernetes.io/master" in node.metadata.labels) ) {
	    node_role=node.metadata.labels["node-role.kubernetes.io/master"];
	    if (node_role == "NoSchedule" ) {
                debug_nodestatus(`${name}: node-role ${node_role}`);
                classes += " unsched";
            }
        }

        if (node.metadata.pseudo) { classes += " pseudo"; }

        const objectDiv="";
        const content="";
        const object=node;

	//console.log(nodeDivText);
	//if (tooltip === undefined) tooltip='';
        nodeDivText = startElemDiv(classes, node, nodeDivText, x, y, tooltip);
	//console.log(nodeDivText);
	/* TODO: REMOVE THIS HACK - learn to do CSS layouts properly! */
        nodeDivText += "<p style=\"padding: 0px; margin: 5px;\" />";
        //nodeDivText += '<hr/>';
        //}

        // Used for correct pod placement on a row:
        node.lastPodImage=undefined;
        //nodeDivText += '<hr/>';

	//console.log(nodeDivText);
        return nodeDivText + embed_text + '</div> <!-- node -->';
};


const createReplicaset = (deployment, replicaset, nodeIdx, masterIdx) => {
    let rpsetDiv='';

    if (show_kube_components.state || (replicaset.metadata.name != "kubernetes")) {

	/* WHY OWNERS ??? => to pickup matching replicasets: */
        owners = replicaset.metadata.ownerReferences;
        owners.forEach( (owner) => {
            if (deployment.metadata.name == owner.name) {
                replicasets_seen.push( replicaset.metadata.uid );
                rpsetDiv += "<br/><br/>" + createReplicaSetDiv(replicaset);
                debug_svc(`${replicaset.metadata.name}: [${replicaset.spec.replicas}] ${deployment.metadata.name} == ${owner.name}`);

		let podsDiv='';
		//if (pods.length > 1) rpsetDiv += '<hr/>';

		pods.forEach( (pod, index) => {
                    itemSeenIdx = indexOfUIDInList(pods_seen, pod.metadata.uid);

                    if (itemSeenIdx == -1) {
                      if (pod.metadata.labels && pod.metadata.labels.run && replicaset.metadata.labels && replicaset.metadata.labels.run && (pod.metadata.labels.run == replicaset.metadata.labels.run)) {
                        nodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
                        if (nodeIndex == nodeIdx) {
                            pods_seen.push( pod.metadata.uid );
                            podsDiv += createPodDiv(pod, nodeIndex);
		        };
		    };
		    };
		});
                rpsetDiv += podsDiv // + '</div> <!-- replicaSet -->';
                rpsetDiv + '</div> <!-- replicaSet -->';
            }
        });
    }
    return rpsetDiv;
};

const createDeployment = (service, deployment, nodeIdx, masterIdx) => {

    let depDiv='';

    if (show_kube_components.state || (deployment.metadata.name != "kubernetes")) {
        itemSeenIdx = indexOfUIDInList(deploys_seen, deployment.metadata.uid, 'createDeployment: searching', true);
        if (itemSeenIdx == -1) {
	    // Service or No service:
	    treat_deploys=false;
            if (service == null) { treat_deploys=true; }
	    if (service && deployment && (deployment.metadata) && (service.metadata.name == deployment.metadata.name)) { treat_deploys=true; }

            if (treat_deploys) {
                //depDiv += '<div class="col">';
                deploys_seen.push( deployment.metadata.uid );
                depDiv += createDeploymentDiv(deployment);
                //depDiv += '</div> <!-- deploymnt -->';

                // replicaset.metadata.ownerReferences.name: flask-app (Deployment)
                replicasets.forEach( (replicaset, index) => {
		    //devDiv += createReplicaset(service, deployment, nodeIdx, masterIdx) => {}
		    depDiv += createReplicaset(deployment, replicaset,nodeIdx, masterIdx);
	        });
            };
        };
    }

    return depDiv;
};

const createServiceLess = (nodeIdx, masterIdx) => {
    let y=0;
    let x=10;

    let noSvcDiv = '';
    let deploymentDivs = '';

    deployments.forEach( (deployment, index) => {
        deploymentDivs += createDeployment(null, deployment, nodeIdx, masterIdx);
    });
    noSvcDiv += '<div> ' + deploymentDivs + '</div> <!-- deploymnt -->' + "<br/>";

    return noSvcDiv;
}

const createService = (service, nodeIdx, masterIdx) => {
    let y=0;
    let x=10;

    let svcDiv = '';

    service.x = x; service.y = y;

    if (show_kube_components.state || (service.metadata.name != "kubernetes")) {
        let deploymentDivs = '';

        deployments.forEach( (deployment, index) => {
            //deploymentDivs += createDeployment(service, deployment, nodeIdx, masterIdx);
            deploymentDivs += createDeployment(service, deployment, nodeIdx, masterIdx);
        });
        //console.log(deploymentDivs);
        svcDiv += createServiceDiv(service, deploymentDivs);

     };

     //svcDiv += "<br/>";
     debug_svc(`services_info='${services_info}'`);
     debug_svc(`service[${nodeIdx}]: ${service.metadata.name}`);

     return svcDiv;
}

const get_run_app_label = (item) => {
    if (item.metadata.labels && item.metadata.labels.run) {
        return item.metadata.labels.run;
    }
    if (item.metadata.labels && item.metadata.labels.app) {
        return item.metadata.labels.app;
    }
    return '';
};

// START PAGE:
const resolveRequests = (nodes, namespaces, deployments, replicasets, pods, services) => {

    //redrawTopMenu();

    var nodeDivText=[];

    // Determine which is the (only) Master node:
    const retList = getMasterIndex(nodes);
    let masterIdx = retList[0];
    let masterNode = retList[1];

    //console.log(`masterIdx: ${masterIdx}`);
    //if (!masterIdx) { console.log(`NOT masterIdx: ${masterIdx}`); };
    //if (masterIdx == undefined) { console.log(`UNDEF masterIdx: ${masterIdx}`); };

    if (masterIdx == undefined) {
        // Create a pseudo-master to display services, replicas:
        masterIdx=0;
	//die("WHY?");

        masterNode={
            "metadata": {
                "pseudo": "True",
                "uid": "pseudo-master(s)",
                "name": "pseudo-master(s) [Managed Cluster]",
                "labels": {
                    "node-role.kubernetes.io/master": "",
                 },
            },
            "status": {
                "conditions": [ { "Ready": "True" } ],
            },
            "spec": {
                "taints": [ ],
            },
        };
        nodes.unshift(masterNode);
    }
    debug_node(`MASTER=node[${masterIdx}]=${masterNode}'`);

    pods_seen=[];
    deploys_seen=[];
    replicasets_seen=[];

    embed_service_text=[];
    nodes.forEach( (node, nodeIndex)      => {

        embed_text=''

        if (nodeIndex == masterIdx) {
            services_info="";
            services.forEach( (service, index) => {
		//console.log("Adding service on master");
                let svcDiv = createService(service, nodeIndex, masterIdx);
                services_info+=svcDiv;
             } );
             embed_text+=services_info;

         } else {
		 // NOOP:
             embed_text='';
         }

         run_labels=[];

         let itemSeenIdx;

         pods.forEach( (pod, podIndex)      => {
             run_label = get_run_app_label(pod)
             itemSeenIdx = indexOfUIDInList(run_labels, run_label);
             if ( itemSeenIdx == -1) { run_labels.push(run_label); }
	 });

	 //console.log(run_labels);

         depsDiv='';
         podsDiv='';
         //run_labels.forEach( (run_label, podIndex)      => {
         for( run_label_idx in run_labels ) {
             run_label_div='';
             run_label = run_labels[run_label_idx];
             //console.log('r_l='+run_label);

             if (nodeIndex == masterIdx) {
                 deployments.forEach( (deploy, deployIndex)      => {
                     itemSeenIdx = indexOfUIDInList(deploys_seen, deploy.metadata.uid);
                     if (itemSeenIdx == -1) {
                         deploy_run_label = get_run_app_label(deploy)
                         if (run_label == deploy_run_label) {
                             deploys_seen.push( deploy.metadata.uid );
                             run_label_div += createDeploymentDiv(deploy, nodeIndex);
		         };
                     }
                 });
                 replicasets.forEach( (replicaset, replicasetIndex)      => {
                     itemSeenIdx = indexOfUIDInList(replicasets_seen, replicaset.metadata.uid);
                     if (itemSeenIdx == -1) {
                         replicaset_run_label = get_run_app_label(replicaset)
                         if (run_label == replicaset_run_label) {
                             replicasets_seen.push( replicaset.metadata.uid );
                             //run_label_div += createXXXXDeploymentDiv(replicaset, nodeIndex);
                             run_label_div += createReplicaSetDiv(replicaset);
		         };
                     }
                 });
	     }

             let matchingPods=0;
             let nodePodsDiv='';
             pods.forEach( (pod, podIndex)      => {
                 itemSeenIdx = indexOfUIDInList(pods_seen, pod.metadata.uid);
                 if (itemSeenIdx == -1) {
                     pod_run_label = get_run_app_label(pod)

                     podNodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
		//console.log(`pod nodeIndex=${nodeIndex}, current nodeIdx=${nodeIdx}`);
                     if (podNodeIndex == nodeIndex) {
                         if (run_label == pod_run_label) {
                             pods_seen.push( pod.metadata.uid );
                             nodePodsDiv += createPodDiv(pod, nodeIndex);
                             matchingPods+=1;
		         };
		     };
		 };
             });;

	     if (matchingPods > 0) {
		 //if (matchingPods > 1) run_label_div += '<hr/>';
		 run_label_div += '<hr/>';
		 run_label_div += nodePodsDiv;

                 const object={ "metadata": { "labels": { "run": run_label, }, }, };
                 podsDiv += '<div class="service"> '+ getIconImgTag(object)+ `${run_label_div} </div>`;
                 //podsDiv += '<div class="service"> '+ `${run_label_div} </div>`;
	     }
	 };
	 //}
         //embed_service_text[nodeIndex] += 'crud';

         embed_text += podsDiv;
         embed_service_text.push( embed_text );
     } );

    //console.log( embed_service_text.length );
    //nodes.forEach( (node, nodeIndex)      => {
        //console.log( embed_service_text[nodeIndex] )
    //});

    nodes.forEach( (node, nodeIndex)      => {
        //console.log(embed_service_text[nodeIndex]);
        nodeDivText[nodeIndex] = createNode(node, nodeIndex, masterIdx, embed_service_text[nodeIndex]);
	    //console.log( "----" + nodeDivText[nodeIndex]  + "----")
    });

	/*
    show_deploys_seen('Service');
    nodes.forEach( (node, nodeIndex)      => {
         let noSvcDiv = createServiceLess(nodeIndex, masterIdx);
         nodeDivText[nodeIndex]+=noSvcDiv;
    });
    show_deploys_seen('ServiceLess');
    */
    //console.log("#deploys_seen(ServiceLess)=" + deploys_seen.length);

     let ALL_info ="";
     nodes.forEach( (node, index)      => {
         objectDiv = nodeDivText[index] + " </div> <!-- node -->";
         const content="";
         //console.log(`**node[${index}]: ::${objectDiv}::**`);
         //console.log(`**node[${index}]: ${objectDiv}**`)
         //console.log(`**node[${index}]**`);
         const modalDiv = createModalText("Node", node, objectDiv, `NODE_${index}`, content);
         //ALL_info += objectDiv;
         ALL_info += modalDiv;
     });

     // Redraw cluster only when changes are detected:
     if ( force_redraw || detectChanges() ) {
         getClusterState_timeout = active_getClusterState_timeout;
         redrawAll(ALL_info);
     } else {
         getClusterState_timeout = idle_getClusterState_timeout;
     }

     pause_visu.state=false;
     if (pause_visu.state) {
         debug_log("NO timeout set - stopping");
     } else {
         debug_log(`setTimeout=${getClusterState_timeout}`);
         setTimeout(getClusterState, getClusterState_timeout);
     }
};

const readCSSVariables = () => {
    imagev1bgcolor = getCSSVariable( "--image-v1-bg-color" );
    imagev2bgcolor = getCSSVariable( "--image-v2-bg-color" );
    imagev3bgcolor = getCSSVariable( "--image-v3-bg-color" );
    imagev4bgcolor = getCSSVariable( "--image-v4-bg-color" );
    imagev5bgcolor = getCSSVariable( "--image-v5-bg-color" );
    imagevLATESTbgcolor = getCSSVariable( "--image-vLATEST-bg-color" );
    imagevDEFAULTbgcolor = getCSSVariable( "--image-vDEFAULT-bg-color" );

    statusErrorFgColor = getCSSVariable( "--status-error-fg-color" );
    statusErrorBgColor = getCSSVariable( "--status-error-bg-color" );
    statusPendingFgColor = getCSSVariable( "--status-error-fg-color" );
    statusPendingBgColor = getCSSVariable( "--status-error-bg-color" );
    statusCreatingFgColor = getCSSVariable( "--status-error-fg-color" );
    statusCreatingBgColor = getCSSVariable( "--status-error-bg-color" );
    statusUnknownFgColor = getCSSVariable( "--status-error-fg-color" );
    statusUnknownBgColor = getCSSVariable( "--status-error-bg-color" );
};

const initialLoad = () => {
    debug_log("LOAD @ " + jQuery.now());

    readCSSVariables();
    getClusterState();
};

const redrawAll = (info) => {
    // When changes are detected, redraw cluster:

    redrawTopMenu();
    $("#k8s_cluster").empty();
    debug_TOP("redrawAll @ " + jQuery.now());

    // NOW we can actually put stuff into the DOM:
    $("#k8s_cluster").append(info);

    // NOW we can add in handlers:
    handlerList.forEach( ( handler_info, index ) => {
        var divid=handler_info[0];
        var divid_op=handler_info[1];
        var handler=handler_info[2];
        //console.log(`Adding handler for ${divid}//${divid_op} + handler`);
        addButtonHandler( divid, "GET", (id, label, divid_op) => { handler(id, label, divid_op); } );
    });

};


//-- Main: --------------------------------------------------------------------

$(document).ready( initialLoad );

