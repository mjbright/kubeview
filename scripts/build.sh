#!/bin/bash
#cd $(dirname $0)/..

mkdir -p tmp

DATE_VERSION=$(date +%Y-%b-%d_%02Hh%02Mm%02S)

PROMPTS=0

function die {
    echo "$0: die - $*" >&2
    exit 1
}

function press {
    echo $*
    echo "Press <return>"
    read DUMMY
    [ "$DUMMY" = "q" ] && exit 0
    [ "$DUMMY" = "Q" ] && exit 0
}

function build {
    # builds dynamic binary:
    # go build -o k8scenario k8scenario.go || exit 1
    # builds static binary:

    time CGO_ENABLED=0 go build -a -o webserv main.go
}

function docker_build_and_push {

    [ $PROMPTS -ne 0 ] && press "About to build docker image"


    docker build -t mjbright/k8scenario:latest .

    if [ -z "$TAG" ];then
        TAG="latest"
        docker push mjbright/k8scenario:latest
    else
        TAG="latest"
        docker tag mjbright/k8scenario:latest mjbright/k8scenario:$TAG
        docker push mjbright/k8scenario:latest
        docker push mjbright/k8scenario:$TAG
    fi
}

build



