
NS=default
NS=test0

kubectl create namespace $NS

kubectl label namespace $NS istio-injection=enabled


