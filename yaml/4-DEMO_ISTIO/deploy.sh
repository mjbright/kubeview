#!/bin/bash

cd $(dirname $0)

NS=test0

set -x
kubectl apply -n $NS -f redis-deployment.yaml 
kubectl apply -n $NS -f flask-deployment.yaml 
kubectl apply -n $NS -f flask-service.yaml
kubectl apply -n $NS -f redis-service.yaml
set +x

#4-DEMO_ISTIO/k8sdemo-service.yaml

