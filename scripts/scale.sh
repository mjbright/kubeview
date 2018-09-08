#!/bin/bash

PROMPTS=0
PROMPTS=1

[ "$1" = "-p"  ] && { shift; PROMPTS=1; }
[ "$1" = "-np" ] && { shift; PROMPTS=0; }


RUN() {
    [ $PROMPTS -eq 0 ] && echo
    echo $*

    [ $PROMPTS -ne 0 ] && { echo -n "> "; read DUMMY; }

    [ "$DUMMY" = "s" ] && return 1
    [ "$DUMMY" = "S" ] && return 1
    [ "$DUMMY" = "q" ] && exit 0
    [ "$DUMMY" = "Q" ] && exit 0

    $*

    return 0
}

REPLICAS=4
[ ! -z "$1" ] && REPLICAS=$1

scale() {
    YAML=$1

    sed "s/replicas: .*/replicas: $REPLICAS/" $YAML > ${YAML}.$REPLICAS

    grep replicas: ${YAML}.$REPLICAS
    RUN kubectl apply -f ${YAML}.$REPLICAS
    cp -a ${YAML}.$REPLICAS ${YAML}.scaled
}

scale yaml/flask-deployment.yaml

