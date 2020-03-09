
press() {
    echo "$*"
    echo "Press <enter>"
    read DUMMY

    [ "$DUMMY" = "q" ] && exit 0
    [ "$DUMMY" = "Q" ] && exit 0
}

die() {
    echo "$0: die - $*" >&2
    exit 1
}

TRANSFER_K8S_CONFIG() {
    kubectl get nodes --kubeconfig=$KUBECONFIG || die "Failed to get nodes using --kubeconfig='$KUBECONFIG'"
    K8S_CLUSTERIP=$(kubectl get svc/kubernetes -o jsonpath='{.spec.clusterIP}')
    echo $K8S_CLUSTERIP

    sed "s/127.0.0.1:.*/$K8S_CLUSTERIP:443/" < $KUBECONFIG > ~/tmp/pod.kubeconfig
    set -x
    kubectl cp ~/tmp/pod.kubeconfig kube-public/kubeview:/root/.kube/config
    kubectl cp js/incluster_test_k8s_js_api.js kube-public/kubeview:/app/incluster_test_k8s_js_api.js
    set +x

    #kubectl -n kube-public exec -it kubeview -- 
    kubectl exec -it -n kube-public kubeview -- /bin/sh -c 'node incluster_test_k8s_js_api.js'
}

RECREATE_POD

RECREATE_POD() {
    set -x
        kubectl delete -f kubeview.yaml 
        kubectl create -f kubeview.yaml 
        kubectl get all  -n kube-public
    set +x
}

TRANSFER_K8S_CONFIG
#CMD="kubectl port-forward -n kube-public pod/kubeview 30008:80"
#press "-- $CMD"
#$CMD

