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

RUN kubectl delete -f yaml/flask-service.yaml
RUN kubectl delete -f yaml/redis-service.yaml
RUN kubectl delete -f yaml/flask-deployment.yaml
RUN kubectl delete -f yaml/redis-deployment.yaml 
set +x
