#!/bin/bash

VAGRANT_DIR=/home/mjb/src/git/pbacterio.cka_lab
IMAGE_PREFIX=mjbright

press() {
    echo $*
    echo "Press <return>"
    read DUMMY
    [ "$DUMMY" = "q" ] && exit 0
    [ "$DUMMY" = "Q" ] && exit 0
}

kubectl get all
press "About to delete all deplyments/replicasets/pods:"

kubectl delete -f yaml/flask-service.yaml 2>/dev/null
kubectl delete -f yaml/k8sdemo-service.yaml 2>/dev/null
kubectl delete -f yaml/redis-service.yaml 2>/dev/null
kubectl delete -f yaml/flask-deployment.yaml 2>/dev/null
kubectl delete -f yaml/k8sdemo-deployment.yaml 2>/dev/null
kubectl delete -f yaml/redis-deployment.yaml 2>/dev/null

kubectl get all

if [ "$1" = "--delete-images" ];then
    cd $VAGRANT_DIR
    pwd

    VAGRANT_NODES=$(vagrant status | awk '/ running / { print $1; }')
    [ -z "$VAGRANT_NODES" ] && {
           vagrant status
	    die "No running nodes"
    }

    for NODE in $VAGRANT_NODES; do
        echo "-- BEFORE: Images on $NODE"
        vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };'"
        vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1:\$2; };')"
        vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };')"
    done

    echo; echo "-------------------------------------------------"
    for NODE in $VAGRANT_NODES; do
        echo "-- AFTER: Images on $NODE"
        vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };'"

    done
    vagrant status

fi

exit 1

IMAGE_PREFIX=mjbright
vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };'"
vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1:\$2; };')"
vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };')"

