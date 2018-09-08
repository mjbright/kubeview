
var common = {
    connector: ["Straight"],
    anchor: ["Left", "Right"],
    endpoint:"Dot",

    paintStyle:{ stroke:"lightgray", strokeWidth:3,  },
    endpointStyle:{ fill:"lightgray", outlineStroke:"darkgray", outlineWidth:10 },

    overlays:[ ["Arrow" , { width:12, length:12, location:0.67 }] ],
};

const start = () => {
    jsPlumb.connect({
        source:"NODE1",
        target:"SERVICE1",
        endpoint:"Rectangle",

        /*connector: ["Straight"],
        anchor: ["Left", "Right"],
        endpoint:"Dot",*/
        
}, common);

    jsPlumb.draggable("NODE1");
    jsPlumb.draggable("SERVICE1");

    /* Add an endpoint on the bottom-side of the left hand item: */
    jsPlumb.addEndpoint("NODE1", {
        anchors:["Bottom"]
    });

    jsPlumb.addEndpoint("SERVICE1", {
        /* Endpoint-Position */
        anchor:"Top",
     
        /* Endpoint-Style */
        endpoint:"Rectangle",
        paintStyle:{ fill:"white", outlineStroke:"blue", strokeWidth:3 },
        hoverPaintStyle:{ outlineStroke:"lightblue" },
     
        /* Connector(Line)-Style */
        connectorStyle:{ outlineStroke:"green", strokeWidth:1 },
        connectorHoverStyle:{ strokeWidth:2 },
        common});
};



jsPlumb.ready(start);

