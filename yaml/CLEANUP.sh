#!/bin/bash

cd $(dirname $0)
pwd

RUN() {
    CMD=$*

    echo; echo "-- $CMD";
    $CMD
}

RUN kubectl delete -f ./2-DEMO_SERVICES/flask-service.yaml
RUN kubectl delete -f ./0-DEMO_BASIC/flask-deployment.yaml
#RUN kubectl delete -f ./0-DEMO_BASIC/k8sdemo-deployment.yaml
#RUN kubectl delete -f ./0-DEMO_BASIC/k8sdemo-service.yaml
RUN kubectl delete -f ./2-DEMO_SERVICES/redis-service.yaml
RUN kubectl delete -f ./0-DEMO_BASIC/redis-deployment.yaml

RUN kubectl delete -n test0 -f ./2-DEMO_SERVICES/flask-service.yaml
RUN kubectl delete -n test0 -f ./2-DEMO_SERVICES/redis-service.yaml
RUN kubectl delete -n test0 -f ./0-DEMO_BASIC/redis-deployment.yaml
RUN kubectl delete -n test0 -f ./0-DEMO_BASIC/flask-deployment.yaml


exit 0

.
./0-DEMO_BASIC
./0-DEMO_BASIC/flask-deployment.yaml
./0-DEMO_BASIC/k8sdemo-deployment.yaml
./0-DEMO_BASIC/k8sdemo-service.yaml
./0-DEMO_BASIC/redis-deployment.yaml
./1-DEMO_SCALING
./1-DEMO_SCALING/flask-deployment.yaml.r4.v1.yaml
./3-DEMO_UPGRADE
./3-DEMO_UPGRADE/flask-deployment.yaml.r4.v2.yaml
./3-DEMO_UPGRADE/flask-deployment.yaml.r4.v3.yaml
./3-DEMO_UPGRADE/flask-deployment.yaml.r4.v4.yaml
./3-DEMO_UPGRADE/flask-deployment.yaml.r4.v5.yaml
./2-DEMO_SERVICES
./2-DEMO_SERVICES/flask-service.yaml
./2-DEMO_SERVICES/redis-service.yaml
./CLEANUP.sh
