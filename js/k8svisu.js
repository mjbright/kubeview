
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

let getversion=true; /* Once only */

let kube_version=undefined;

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
var pause_visu           = { state: false };
var show_kube_components = { state: false };
var enable_tooltips      = { state: false };

const debug_timing=false;

// Include type prefix in displayed element names, e.g. 'Service: <service-name>':
const include_type=true;

//-- Configuration definitions: -----------------------------------------------

//const getClusterState_timeout = 5000;
const getClusterState_timeout = 3000;

var namespace="default";

const version_path="/version";
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
            type_info="Service: ";
        } else if (type == 'deployment') {
            type_info="Deploy: ";
        } else if (type == 'replicaset') {
            //type_info="RS: ";
            type_info="";
        } else if (type == 'pod') {
            type_info="";
        } else {
            type_info=capitalize1stChar(type)+': ';
        }
    }

    const uid=object.metadata.uid;
    const name=object.metadata.name;
    tooltip=`${type}
    ${name}
    
    [uid:${uid}]

${tooltip}`;

    color_style=''
    if (fg != undefined) { color_style+='color: ' + fg + ';'; }
    if (bg != undefined) { color_style+='background-color: ' + bg + ';'; }

    //debug_color(`fg: ${fg} bg:${bg}`);
    itemSeenIdx = indexOfUIDInList(ids_seen, uid);
    if (itemSeenIdx != -1) {
        die("id seen already: " + uid);
    }
    ids_seen.push( uid );

    classes += " tooltip";
    let datatip = ` data-tip=""`;
    if ( enable_tooltips.state ) {
        datatip = ` data-tip="${tooltip}"`;
    }

    //const stElemDiv=`<div id="${uid}" class="${classes} tooltip" data-tip="${tooltip}" style="left: ${x};top: ${y};${color_style}" > ${type_info}${text}`;
    if (color_style == '') {
        stElemDiv=`<div id="${uid}" class="${classes}" ${datatip} > ${type_info}${text}`;
    } else {
        stElemDiv=`<div id="${uid}" class="${classes}" ${datatip} style="${color_style}" > ${type_info}${text}`;
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

    let oldConfigHash=configHash;

    configHash='';

    configHash += enable_tooltips.state;
    configHash += show_kube_components.state;

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

const getHTMLLabelsAnnotations = (object) => {
    let retStr='';

    retStr += '<ul>';

    if (object.metadata.labels) {
        retStr += `<h3>Labels</h3>`;
        Object.keys(object.metadata.labels).forEach( (key, index) => {
            value = object.metadata.labels[key];
            retStr += `<li>${key} - ${value}</li>`;
	});
    }

    if (object.metadata.annotations) {
        retStr += `<h3>Annotations</h3>`;
        Object.keys(object.metadata.annotations).forEach( (key, index) => {
            value = object.metadata.annotations[key];
            retStr += `<li>${key} - ${value}</li>`;
	});
    }

    retStr += '</ul>';
    return retStr;
};

const getLabelsAnnotations = (object, html) => {
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

    if ( getversion ) {
        const versionReq = $.getJSON(version_path, (obj) => {
            kube_version=obj.gitVersion; });
        requests.push(versionReq);
        getversion=false; /* Once only */
	console.log("GOT VERSION");
    }
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
            // UNUSED: name = '*' + node.metadata.name;
            // UNUSED: role = 'master';
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

    //die(`Failed to find node <${nodeName}> in list`);
    return -1;
};

const createDeploymentDiv = (object) => {
    let replicas=`${object.status.readyReplicas}/${object.spec.replicas}`;
    let replicasForModal=`${object.status.readyReplicas} present/${object.spec.replicas} desired`;
    let objectText=`${object.metadata.name} [${replicas}]`;
    if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }

    //let labels=getLabelsAnnotations(object);
    //let tooltip=`${labels}`;
    let tooltip='';
    let x=0;
    let y=0;

    const objectDiv = createElemDiv("deployment col", object, objectText, x, y, tooltip);
    //return objectDiv;
    const content=`
		<ul>
		<li>Replicas: ${replicasForModal}</li>
		</ul>
		`;
    const modalDiv = createModalText('Deployment', object, objectDiv, object.metadata.uid, content)
    return modalDiv;
};

const createServiceDiv = (object) => {
    // spec: { ports: [ { protocol: 'TCP', port: 5000, targetPort: 5000, nodePort: 31896 } ],
    ports_info='PORTS: ';
    node_port=undefined;
    object.spec.ports.forEach( (port, index) => {
        ports_info+=$.param( port, true);
        if (port.nodePort) { node_port=port.nodePort; }
    });

    let objectText=`${object.metadata.name}`;
    if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run}`; }
    //if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }

    //let labels=getLabelsAnnotations(object);
    let tooltip="";
    let x=0;
    let y=0;

    if (node_port != undefined) {
        objectText += ' [NodePort: ' + node_port + ']';
        tooltip += `NodePort: ${node_port}`;
    }
    objectDiv = '<div>';
    //objectDiv = '';
    objectDiv += createElemDiv("service", object, objectText, x, y, tooltip);
    content='';
    modalDiv = createModalText('Service', object, objectDiv, objectText, content);
    //modalDiv += '</div>';
    //svcDiv += createElemDiv("service", object, label, x, y, tooltip);

    return modalDiv;
};

const createReplicaSetDiv = (object) => {
    let replicas = object.spec.replicas;
    let objectText=`${object.metadata.name}`;

    /* NOT DEFINED: const image=object.spec.containers[0].image; */
    /* DEFINED: const image=object.spec.template.spec.containers[0].image; */
    const image=getImage(object);
    const image_version=getImageVersion(object, image);
    // could be latest: if (image_version == '') { die("replicaset: empty image_version"); }
    if (image_version == undefined) { die("replicaset: undefined image_version"); }

    //if (object.metadata.labels.run) { objectText=`${object.metadata.labels.run} [${replicas}]`; }
    if (object.metadata.labels.run) {
        //let postfix=objectText.substr(objectText.lastIndexOf("-"));
	//objectText=`${object.metadata.labels.run}${image_version}-*${postfix}`;
	//objectText=`${object.metadata.labels.run}${image_version}-*${postfix}`;
	objectText=`${object.metadata.labels.run}:${image_version}`;
    };
    objectText+=`[${replicas}]`;

    //let labels=getLabelsAnnotations(object);
    let tooltip="";
    let x=0;
    let y=0;

    //classes="replicaset box-outer col";
    //classes="replicaset outter col";
    //objectText='<div class="box-inner">HELLO</div>' + objectText;
    classes="replicaset col";
    if (replicas == 0) {
        fg='black';
        bg='gray';
    } else {
        colors = getObjectColors(object, image, image_version);
        fg=colors[0];
        bg=colors[1];
    }

    debug_color(`[RS COLOR replicas=${replicas}] fg: ${fg} bg:${bg}`);
    objectDiv = createElemDiv(classes, object, objectText, x, y, tooltip, fg, bg);

    const content=''
    const modalDiv = createModalText('replicaset', object, objectDiv, objectText, content);

    return modalDiv;
};

const getType = (object) => {
    if (object.metadata.selfLink) {
        if (object.metadata.selfLink.indexOf("/deployments/") != -1) {
            return 'deployment';
        } else if (object.metadata.selfLink.indexOf("/pods/") != -1) {
            return 'pod';
        } else if (object.metadata.selfLink.indexOf("/services/") != -1) {
            return 'service';
        } else if (object.metadata.selfLink.indexOf("/replicasets/") != -1) {
            return 'replicaset';
        } else if (object.metadata.selfLink.indexOf("/nodes/") != -1) {
            return 'node';
	}
    }

    return 'unknown';
}

const getImage = (object, image) => {

    if (getType(object) == 'replicaset') {
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
        return '';
    }

    let image_version='';
    if ((image.indexOf(":latest") == -1) && (image.indexOf(":") != -1)) {
        image_version='['+image.substr( 1+image.lastIndexOf(":") )+']';
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
    if (type == 'pod' && phase == 'Running') {
        colorBasedOnImage=true;
    }
    if (type == 'replicaset') {
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
        fg='black';
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
        fg=statusErrorFgColor;
        bg=statusErrorBgColor;
    } else if ( phase == "Pending" ) {
        fg=statusPendingFgColor;
        bg=statusPendingBgColor;
    } else if ( phase == "Container Creating" ) {
        fg=statusCreatingFgColor;
        bg=statusCreatingBgColor;
    } else {
        // ????
        console.log(`Unknown ${phase} seen`);
        fg=statusUnknownFgColor;
        bg=statusUnknownBgColor;
        die(`Unknown ${phase} seen on ${type}:${name}`);
    }

    if (type == 'replicaset') {
      if (colorBasedOnImage) {
        debug_color(`[Based on image, image ${image}][${phase}] fg: ${fg} bg:${bg}`);
      } else {
        debug_color(`[Based on phase, image ${image}][${phase}] fg: ${fg} bg:${bg}`);
      }
    }
    return [fg, bg];
}


const createPodDiv = (object, nodeIndex) => {
    let objectText=`${object.metadata.name}`;
    const image=object.spec.containers[0].image;
    const image_version=getImageVersion(object);

    if (object.metadata.labels.run) {
        let postfix=objectText.substr(objectText.lastIndexOf("-"));
	objectText=`${object.metadata.labels.run}${image_version}-*${postfix}`;
    }

    let tooltip="";
    let x=0;
    let y=0;

    //x += 100;
    loop++;

    debug_pod( `${object.metadata.uid} - ${object.metadata.name} on ${object.spec.nodeName}` );

    tooltip='';

    colors = getObjectColors(object, image, image_version);
    fg=colors[0];
    bg=colors[1];
    //debug_color(`POD COLOR: fg=${fg} bg=${bg}`);
    //debug_pod(`${object.metadata.name} is '${object.status.phase}' on node[${nodeIndex}] '${object.spec.nodeName}'`);

    classes="pod"
    if (nodes[nodeIndex].lastPodImage == undefined) {
        classes += " row";
    } else if (nodes[nodeIndex].lastPodImage == image) {
        classes += " col";
    }
    nodes[nodeIndex].lastPodImage=image;

    const objectDiv = createElemDiv(classes, object, objectText, x, y, tooltip, fg, bg);
    const content='';
    const modalDiv = createModalText('Pod', object, objectDiv, objectText, content);

    return modalDiv;
};

const indexOfUIDInList = (idlist, id) => {
    var foundIdx=-1;

    idlist.forEach( (item_id, index) => {
        if (item_id == id) { foundIdx = index; return; }
    });
    return (foundIdx);
};

const createCheckBoxText = (id, value, label, checkState) => {
    let checked='';
    if (checkState) { checked="checked='checked'"; }

    let buttonDivText=`<div class="col"><input type="checkbox" id="${id}" name="${id}"${checked} value="${value}" /> <label for="${value}">${label}</label></div>`;
    /*let showKubeCompButtonText='<div class="col">' +
        '<input type="checkbox" id="show_kubernetes" name="show_kubernetes" ' + checked + ' value="show_all" />' +
        '<label for="show_all">Show Kubernetes components</label>' +
      '</div>';*/

    return buttonDivText;
};

const addCheckBoxHandler = (id, label, checkState_obj, handler) => {
    let button = document.querySelector(`#${id}`);

    button.addEventListener('click', (e) => {
        checkState_obj.state = !checkState_obj.state;
        debug_log(`Button ${id} clicked, '${label}' state now: ${checkState_obj.state}`);
	handler(id, label, checkState_obj);
    });
};

const createModalText = (type, object, href_content, id, markup) => {

    const labelsAnnotations = getHTMLLabelsAnnotations(object);
    const image = getImage(object);
    let imageText = undefined;

    if (image == undefined) {
        imageText = '';
    } else {
        imageText = `<h3>Image: ${image}</h3>`;
    }

    let selfLink='';
    if (object.metadata.selfLink) {
        selfLink=`<h3>selfLink:
	    <a href="${object.metadata.selfLink}"> ${object.metadata.selfLink} </a>
		    </h3>`;
    }

    // http://127.0.0.1:18002/api/v1/namespaces/default/services/flask-app/proxy/
    let proxyLink='';
    /*
    * window.location.href returns the href (URL) of the current page
    * window.location.hostname returns the domain name of the web host
    * window.location.pathname returns the path and filename of the current page
    * window.location.protocol returns the web protocol used (http: or https:)
    * window.location.assign loads a new document
    */
    if (getType(object) == 'service') {
        const protocol=window.location.protocol;
        const hostname=window.location.hostname;
        const port=window.location.port;
        const rootURL=`${protocol}://${hostname}:${port}`;
        //console.log(`protocol=${window.location.protocol}  hostname=${window.location.hostname} rootURL=${rootURL}`);
        const path = `/api/v1/namespaces/${namespace}/services/${object.metadata.name}/proxy/`;
        const href = `${rootURL}${path}`;
        //console.log(`href=${href}`);
        proxyLink=`<h3>Service Link:</h3>
	    <a href="${path}"> ${href} </a>
		    `;
	    //die("TEST");
    };

    const content=`<h1>${type}: ${object.metadata.name}</h1>
                 <h3>UID: ${object.metadata.uid}</h3>
                ${imageText}
                ${selfLink}
                ${proxyLink}
                ${labelsAnnotations}
                ${markup}
		`;

    const modalText=`
    <a class="modal_href" href="#${id}_modal">${href_content}</a>

    <div id="${id}_modal" class="modalDialog">
      <div>
        <a href="#${id}_close_modal" title="Close" class="close">X</a>
	${content}
      </div>
      </div>`;

    return modalText;
};

const startPage = () => {
    //----- Build up namespace dropdown menu:
    const nsMenu = buildNamespaceMenu(namespaces);

    let runningButtonText = createCheckBoxText( "run_or_pause", "Pause", "Pause", pause_visu.state);

    let tooltipButtonText = createCheckBoxText( "enable_tooltip", "Enable tooltips", "Enable tooltips", enable_tooltips.state);

    let showKubeCompButtonText = createCheckBoxText( "show_kubernetes", "show_all", "Show Kubernetes components", show_kube_components.state);

    let toplineMenu=`<div><div class="row" ><b>Cluster Name:</b> <i>${CLUSTERNAME}</i>, <b>Kubernetes:</b><i>${kube_version}</i>, <b>Namespace:</b> </div> <div class="col" > ${nsMenu} </div></div>
    ${runningButtonText} ${tooltipButtonText} ${showKubeCompButtonText}
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ${sourceURL}`;

    $('#k8s_namespace').empty();
    $('#k8s_namespace').append(toplineMenu);

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

const resolveRequests = (nodes, namespaces, deployments, replicasets, pods, services) => {

    startPage();

    var nodeDivText=[];

    // Determine which is the (only) Master node:
    const retList = getMasterIndex(nodes);
    let masterIdx = retList[0];
    let masterNode = retList[1];
    debug_node(`MASTER=node[${masterIdx}]=${masterNode}'`);

    nodes.forEach( (node, index)      => {
        //let y=1000*index;
        let y=0;
        let x=0; //100*index;

        nodeDivText[index]='';

        const name = node.metadata.name;
        let nameText = name;
        role = 'worker';
        if (index == masterIdx) {
            nameText = '<b>*<u>' + node.metadata.nameText + '</u>*</b>';
            role = 'master';
        }

        nodeDivText[index]+='<i>' + name + '</i>';
        tooltip=''

        classes="node";
        var ready=true;
        // debug_nodestatus(`${name}: Assuming ready ...`);
        node.status.conditions.forEach( (condition, index) => {
            if (condition.type == 'Ready') {
                if (condition.status == 'True') {
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
		   ( (node.spec.taints[name] == 'DoNotSchedulePods') ||
		     (node.spec.taints[name] == 'NoExecute') )) {
            classes += " unsched";
            debug_nodestatus(`${name}: Tainted ${node.spec.taints[node.metadata.name]}`);
        } else if ( (index == masterIdx) &&
                    ('node-role.kubernetes.io/master' in node.metadata.labels) ) {
	    node_role=node.metadata.labels['node-role.kubernetes.io/master'];
	    if (node_role == 'NoSchedule' ) {
                debug_nodestatus(`${name}: node-role ${node_role}`);
                classes += " unsched";
            }
        }

        stElemDiv = startElemDiv(classes, node, nodeDivText[index], x, y, tooltip);
        nodeDivText[index] = stElemDiv;
        //if (index != masterIdx) {
	/* TODO: REMOVE THIS HACK - learn to do CSS layouts properly! */
        nodeDivText[index] += '<p style="padding: 0px; margin: 5px;" />';
        //}

        // Used for correct pod placement on a row:
        node.lastPodImage=undefined;
    });

    deploys_seen=[];
    replicasets_seen=[];

    services_info='';
    services.forEach( (service, index) => {
        let y=0;
        let x=10;

        service.x = x; service.y = y;
        if (show_kube_components.state || (service.metadata.name != 'kubernetes')) {
            svcDiv = createServiceDiv(service);
            deployments.forEach( (deployment, index) => {
                if (show_kube_components.state || (deployment.metadata.name != 'kubernetes')) {
                    if (service.metadata.name == deployment.metadata.name) {
                        //svcDiv += '<div class="col">';
                        deploys_seen.push( deployment.metadata.uid );
                        svcDiv += createDeploymentDiv(deployment);
                        //svcDiv += '</div>';

                        // replicaset.metadata.ownerReferences.name: flask-app (Deployment)
                        replicasets.forEach( (replicaset, index) => {
                            if (show_kube_components.state || (replicaset.metadata.name != 'kubernetes')) {
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
         //let x=110; //100*index;
         let y=0;
         let x=0;

         itemSeenIdx = indexOfUIDInList(deploys_seen, deployment.metadata.uid);
         debug_dep(`${itemSeenIdx} ${deployment.metadata.uid}`);
         //debug_dep(`${itemSeenIdx} ` + $.param( deployment.metadata, true));

         if (itemSeenIdx == -1) {
             if (show_kube_components.state || (deployment.metadata.name != 'kubernetes')) {
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
     replicasets.forEach( (replicaset, index) => {
         //let y=100+100*index;
         //let x=110; //100*index;
         let y=0;
         let x=0;

         itemSeenIdx = indexOfUIDInList(replicasets_seen, replicaset.metadata.uid);
         if (itemSeenIdx == -1) {
             if (show_kube_components.state || (replicaset.metadata.name != 'kubernetes')) {
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
         nodeIndex = getNodeIndex(nodes, pod.spec.nodeName);
         const podDiv = createPodDiv(pod, nodeIndex);
         //debug_pod(`pod[${index}]: ${pod.metadata.name}`);

         nodeDivText[nodeIndex] += podDiv;
     });

     let ALL_info ='';
     nodes.forEach( (node, index)      => {
         ALL_info += nodeDivText[index] + ' </div>';
     });

     // Redraw cluster only when changes are detected:
     if ( force_redraw || detectChanges() ) {
         redrawAll(ALL_info);
     }

     if (pause_visu.state) {
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

    imagev1bgcolor = getCSSVariable( '--image-v1-bg-color' );
    imagev2bgcolor = getCSSVariable( '--image-v2-bg-color' );
    imagev3bgcolor = getCSSVariable( '--image-v3-bg-color' );
    imagev4bgcolor = getCSSVariable( '--image-v4-bg-color' );
    imagev5bgcolor = getCSSVariable( '--image-v5-bg-color' );
    imagevLATESTbgcolor = getCSSVariable( '--image-vLATEST-bg-color' );
    imagevDEFAULTbgcolor = getCSSVariable( '--image-vDEFAULT-bg-color' );

    statusErrorFgColor = getCSSVariable( '--status-error-fg-color' );
    statusErrorBgColor = getCSSVariable( '--status-error-bg-color' );
    statusPendingFgColor = getCSSVariable( '--status-error-fg-color' );
    statusPendingBgColor = getCSSVariable( '--status-error-bg-color' );
    statusCreatingFgColor = getCSSVariable( '--status-error-fg-color' );
    statusCreatingBgColor = getCSSVariable( '--status-error-bg-color' );
    statusUnknownFgColor = getCSSVariable( '--status-error-fg-color' );
    statusUnknownBgColor = getCSSVariable( '--status-error-bg-color' );

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

