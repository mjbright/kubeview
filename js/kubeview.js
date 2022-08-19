
// DEFINE functions to help adding rect/text/circle/ ...
const append_rect = function(svg, x, y, width, height, fill, stroke, strokewidth) {
    //console.log(svg);
    var ret = svg.append("rect").
            attr("x", x).attr("y", y).attr("width", width).attr("height", height);

    if (fill       != "") ret=ret.attr("fill", fill);
    if (stroke     != "") ret=ret.attr("stroke", stroke);
    if (strokewidth!= "") ret=ret.attr("stroke-width", strokewidth);
    return ret;
}

const append_circle = function(svg, cx, cy, r, fill, stroke, strokewidth) {
    //console.log(svg);
    var ret = svg.append("circle").
            attr("cx", cx).attr("cy", cy).attr("r", r);

    if (fill       != "") ret=ret.attr("fill", fill);
    if (stroke     != "") ret=ret.attr("stroke", stroke);
    if (strokewidth!= "") ret=ret.attr("stroke-width", strokewidth);
    return ret;
};

const append_text = function yy(svg, x, y, fill, text) {
    //console.log(svg);
    var ret = svg.append("text").
            attr("x", x).attr("y", y).attr("fill", fill).text(text);

 //   if (fill       != "") ret=ret.attr("fill", fill);
 /*   .attr("text-anchor", "end")
    .style("font-family", "sans-serif")
    .style("font-size", "11px");
    */
    return ret;
};

const svg = d3.select(".responsive-svg-container")
    .append("svg")
    .attr("viewBox", "0 0 1200 1600")
    .style("border", "1px solid black");
 
/*    
append_rect(svg, "30", "30", "100", "150", "cyan", "blue", "10");
append_circle(svg, "30", "130", "40", "yellow", "blue", "10");
append_text(svg, 100,100,"red","hello world");
*/

// curl -sL 127.0.0.1:8001/api/v1/pods | jq '.items[].metadata.name'
//const api = "http://127.0.0.1:6443";
const api = "http://127.0.0.1:8001";

function listPods( items ) {
    console.log('----');
    items.forEach( element => console.log(`${element.metadata.namespace}/${element.metadata.name}`))
}

var global_y=20;

function displayDeployments( items ) {
    const start_x = 150;
    const start_y = 5;
    var x=start_x;
    var y=start_y;
    var colors=["red", "green", "blue", "pink", "lightgreen", "cyan", "orange", "turquoise", "yellow"]
    var namespace="";
    var container_image="";
    var color_idx=-1;
    var color="";

    append_text(svg, 2, y+10, "", "deployments:")
    items.forEach( element => {
        x += 25;
        if (element.metadata.name != name) {
            name = element.metadata.name 
            color_idx+=1;
            color=colors[color_idx]; 
        }
        if (element.metadata.namespace != namespace) {
            namespace = element.metadata.namespace
            y+=20
            x=start_x
            color_idx=0;
            //console.log(namespace)
            //append_rect(svg, x, y, 20, 20, color);
            append_text(svg, 5, y+15, "", namespace)
        }
        append_rect(svg, x, y, 20, 20, color);
        
        console.log(`${element.metadata.namespace}/${element.metadata.name}: ${x},${y} ${color}`)
    });

    global_y=(y+50);
}

function displayPods( items ) {
    //const start_x = 150;
    //var x=start_x;
    //var y=10;
    const start_x = 150;
    const start_y = global_y;
    //const start_y = 400;
    var x=start_x;
    var y=start_y;
    var colors=["red", "green", "blue", "pink", "lightgreen", "cyan", "orange", "turquoise", "yellow"]
    var namespace="";
    var container_image="";
    var color_idx=-1;
    var color="";

    append_text(svg, 2, y+10, "", "pods:")
    items.forEach( element => {
        x += 25;
        if (element.spec.containers[0].image != container_image) {
            // NEEDS correcting, could be from different deployment, or pod alone
            container_image = element.spec.containers[0].image
            color_idx+=1;
            color=colors[color_idx]; 
        }
        if (element.metadata.namespace != namespace) {
            namespace = element.metadata.namespace
            y+=20
            x=start_x
            color_idx=0;
            //console.log(namespace)
            //append_rect(svg, x, y, 20, 20, color);
            append_text(svg, 5, y+15, "", namespace)
        }
        append_rect(svg, x, y, 20, 20, color);
        
        console.log(`${element.metadata.namespace}/${element.metadata.name}: ${x},${y} ${color}`)
    });
    //global_y=120;
    console.log(global_y)
}

async function getPods() { //}, namespace) {
    var url = `${api}/api/v1/pods`;
    console.log(`url="${url}"`);

    const res  = await fetch(url);
    const data = await res.json();

    console.log( data.items )

    displayPods( data.items );
    //listPods( data.items );
    return data;
  }
  
  async function getDeployments() { //}, namespace) {
    var url = `${api}/apis/apps/v1/deployments`;
    console.log(`url="${url}"`);

    const res  = await fetch(url);
    const data = await res.json();

    console.log( data.items )

    displayDeployments( data.items );
    //listPods( data.items );
    return data;
  }

  //console.log("here-0");
  //console.log( getPods() );
  deploys = getDeployments();
  pods = getPods();
  //console.log(pods.items);
  //console.log("here-1");
  