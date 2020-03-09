const k8s = require('@kubernetes/client-node');

// console.log("OK1 object: %o", k8s);

const kc = new k8s.KubeConfig();
console.log("OK2 object: %o", kc);

kc.loadFromDefault();
console.log("OK3 object: %o", kc);

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
console.log("OK4 object: %o", k8sApi);
console.log(" ^ OK4")

k8sApi.listNamespacedPod('default').then((res) => {
    console.log(`OK5 ${res}`);
    console.log(res.body);
}).catch((err) => {
        console.log(err);
    });
//.catch(() => { console.log("CATCH"); });
