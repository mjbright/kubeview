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


delete_all_kubernetes_entities() {
    kubectl get all
    press "About to delete all deplyments/replicasets/pods:"

    kubectl delete -f yaml/flask-service.yaml 2>/dev/null
    kubectl delete -f yaml/k8sdemo-service.yaml 2>/dev/null
    kubectl delete -f yaml/redis-service.yaml 2>/dev/null
    kubectl delete -f yaml/flask-deployment.yaml 2>/dev/null
    kubectl delete -f yaml/k8sdemo-deployment.yaml 2>/dev/null
    kubectl delete -f yaml/redis-deployment.yaml 2>/dev/null

    kubectl get all
}

remove_all_images() {
    cd $VAGRANT_DIR
    pwd

    # QUICK AND DIRTY:
    vagrant ssh node1 -- sudo docker rmi mjbright/flask-web:v1 mjbright/flask-web:v2 mjbright/flask-web:v3 redis
    vagrant ssh node2 -- sudo docker rmi mjbright/flask-web:v1 mjbright/flask-web:v2 mjbright/flask-web:v3 redis
    return


    VAGRANT_NODES=$(vagrant status | awk '/ running / { print $1; }')
    [ -z "$VAGRANT_NODES" ] && {
           vagrant status
	    die "No running nodes"
    }

    for NODE in $VAGRANT_NODES; do
        [ "$NODE" = "master" ] && { echo "Skipping Master node"; continue; }

        echo "-- BEFORE: Images [matching $IMAGE_PREFIX] on $NODE"

	press "LIST IMAGES:"
        vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \\"\$1:\$2\\"; };'"

	press "REMOVE IMAGE VERSIONS:"
        vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \"\$1\:\$2\"; };')"

	press "REMOVE IMAGES without version:"
        vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };')"
    done

    echo; echo "-------------------------------------------------"
    for NODE in $VAGRANT_NODES; do
        echo "-- AFTER: Images on $NODE"
        vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };'"

    done
    vagrant status
}

delete_all_kubernetes_entities

#remove_all_images

if [ "$1" = "--delete-images" ];then
    remove_all_images
fi

exit 1

IMAGE_PREFIX=mjbright
vagrant ssh $NODE -- "sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };'"
vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1:\$2; };')"
vagrant ssh $NODE -- "sudo docker rmi \$(sudo docker images | awk '/^$IMAGE_PREFIX/ { print \$1; };')"

