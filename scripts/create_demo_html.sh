#!/bin/bash

die() {
    echo "$0: die - $*" >&2
    exit 1
}

cd $(dirname $0)/..

OPTS=""

HOST_IP=127.0.0.1
#KUBENODE_IP=192.168.99.100

TTYD_PORT=9001

NAMESPACE="default"


echo; echo "Checking node type:"
TYPE=$(kubectl get nodes | awk '$3 == "master" { print $1; exit 0; }')
KUBENODE_NAME=$TYPE

case "$TYPE" in
    docker-for-desktop)
        echo "type: docker-for-desktop"
        KUBENODE_IP=127.0.0.1
        ;;
    minikube)
        echo "type: minikube"
	KUBENODE_IP=$(minikube ip)
        ;;
    *)
        echo "type: other"
        KUBENODE_IP=$(kubectl describe nodes | awk '/InternalIP:/ { print $2; }')
        ;;
esac

VISUALIZER_PORT=8003

SERVICE_PORT="PORT_UNSET"
SERVICE_PORT="1234"
REMOTE=0

while [ ! -z "$1" ];do
    case $1 in
        -r)   # Access remotely:
            REMOTE=1
            HOST_IP=$(ip a | awk '!/127.0.0.1/ && / inet / { FS="/"; $0=$2; print $1; exit(0); }')
            ;;

        -s)   # Set service SERVICE_PORT port:
            echo; echo "Getting service information:"
            kubectl get svc
            SERVICE_PORT=$(kubectl get svc | awk '/^flask-app/ { FS=":"; $0=$5; FS="/"; $0=$2; print $1; }')
            ;;

        *)  die "Bad option <$1>";;
    esac
    shift
done

_SERVICE_PORT=$SERVICE_PORT

[ $REMOTE -ne 0 ] && {
    let LOCAL_TTYD_PORT=TTYD_PORT+10000
    let LOCAL_SERVICE_PORT=SERVICE_PORT+10000
    let LOCAL_VISUALIZER_PORT=VISUALIZER_PORT+10000

    echo; echo "Open ssh tunnel to machine as
      ssh -L $LOCAL_SERVICE_PORT:$KUBENODE_IP:$SERVICE_PORT -L $LOCAL_VISUALIZER_PORT:127.0.0.1:$VISUALIZER_PORT -L $LOCAL_TTYD_PORT:127.0.0.1:$TTYD_PORT -Nv ${USER}@$HOST_IP"

    TTYD_PORT=$LOCAL_TTYD_PORT
    SERVICE_PORT=$LOCAL_SERVICE_PORT
    VISUALIZER_PORT=$LOCAL_VISUALIZER_PORT

    KUBENODE_IP=127.0.0.1
    HOST_IP=127.0.0.1
}

[ "$_SERVICE_PORT" = "1234" ] && SERVICE_PORT="PORT_UNSET"

TTYD_URL=127.0.0.1:$TTYD_PORT
SERVICE_URL=http://${KUBENODE_IP}:${SERVICE_PORT}
VISUALIZER_URL=http://${HOST_IP}:$VISUALIZER_PORT/static/index.html

echo
echo "Creating demo.html:"
echo "    - Using TTYD_URL=$TTYD_URL"
echo "    - Using SERVICE_URL=$SERVICE_URL"
echo "    - Using VISUALIZER_URL=$VISUALIZER_URL"

#sed -e "s/SERVICE_URL/$SERVICE_URL/g" -e "s/VISUALIZER_URL/$VISUALIZER_URL/g" demo.html.template > demo.html

sed -e "s-TTYD_URL-$TTYD_URL-g" \
    -e "s-SERVICE_URL-$SERVICE_URL-g" \
    -e "s-VISUALIZER_URL-$VISUALIZER_URL-g" \
    -e "s/KUBENODE_NAME/$KUBENODE_NAME/g" \
    -e "s-KUBENODE_IP-$KUBENODE_IP-g" \
    -e "s-NAMESPACE-$NAMESPACE-g" \
    demo.html.template > demo.html


## TODO: give local and remote SERVICE_URLs if different:
## WGET_TIMEOUT=2
## WGET_RETRIES=1
## echo "Test service with: (try $WGET_RETRIES time(s), timeout of $WGET_TIMEOUT secs)"
## echo "    wget -T $WGET_TIMEOUT -t $WGET_RETRIES -O - $SERVICE_URL"
echo
echo "Test service with:"
echo "    curl $SERVICE_URL"

