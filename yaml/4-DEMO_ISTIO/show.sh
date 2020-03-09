#!/bin/bash

NS=test0

cd $(dirname $0)

( set -x; kubectl describe -n $NS pod $(kubectl -n $NS get pods | awk '/^flask-app/ { print $1; }'); set +x; ) 2>&1 | less


