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

VERSION=v2
[ ! -z "$1" ] && VERSION=$1

upgrade() {
    YAML=$1

    sed "s/\\(image:.*\):v1/\\1:$VERSION/" ${YAML}.scaled > ${YAML}.${VERSION}


    grep image: ${YAML}.${VERSION}
    RUN kubectl apply -f ${YAML}.${VERSION}
}

upgrade yaml/flask-deployment.yaml

