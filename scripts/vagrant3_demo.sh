#!/bin/bash


press() {
    echo $*
    echo "Press <return> [qQ,-x,+x,mo]"
    read DUMMY
    [ "$DUMMY" = "q" ] && exit 0
    [ "$DUMMY" = "Q" ] && exit 0
    [ "$DUMMY" = "-x" ] && set -x
    [ "$DUMMY" = "+x" ] && set +x
    [ "$DUMMY" = "mo" ] && {
        for FILE in $*; do if [ -f $FILE ]; then more $FILE; fi; done
    }
}

press_RUN() {
    press $*
    $*
}

getURL() {
    local URL=$1

    #press_RUN wget -O - ${URL}/
    press_RUN curl -A Chrome -sL ${URL}/
}

press_RUN "kubectl get nodes -o wide"

press "Obtain the master public ip:"
kubectl describe node master | grep -i ip
MASTER_FLANNEL_IP=$( kubectl describe node master | awk '/public-ip=/ { FS="="; $0=$1; print $2; }' )

#if [ 1 -eq 0 ];then

press_RUN kubectl get pods

press_RUN kubectl apply -f yaml/redis-deployment.yaml
press_RUN kubectl get pods

press_RUN kubectl apply -f yaml/flask-deployment.yaml
press_RUN kubectl get pods


press_RUN kubectl apply -f yaml/redis-service.yaml 
press_RUN kubectl get svc

press_RUN kubectl apply -f yaml/flask-service.yaml 
press_RUN kubectl get svc
#fi

SERVICE_PORT=$( kubectl get svc --no-headers flask-app | sed -e 's/.*://' -e 's/\/TCP.*//' )
SERVICE_URL=http://${MASTER_FLANNEL_IP}:${SERVICE_PORT}

#if [ 1 -eq 0 ];then
#fi
getURL ${SERVICE_URL}/

press_RUN kubectl apply -f yaml/flask-deployment.yaml.r4.v1.yaml 
press_RUN kubectl get pods
press_RUN kubectl get pods
press_RUN wget -O - ${SERVICE_URL}/
press_RUN wget -O - ${SERVICE_URL}/
press_RUN wget -O - ${SERVICE_URL}/

press_RUN kubectl apply -f yaml/flask-deployment.yaml.r4.v2.yaml 
press_RUN kubectl get pods
press_RUN wget -O - ${SERVICE_URL}/

press_RUN kubectl apply -f yaml/flask-deployment.yaml.r4.v3.yaml 
press_RUN kubectl get pods
press_RUN wget -O - ${SERVICE_URL}/


