
#API_URL="https://10.96.0.1:443"
API_URL="https://kubernetes:443"

kubectl exec -it debug -- /bin/sh -c "wget -q -O - --no-check-certificate $API_URL/version"


