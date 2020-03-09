
IMAGE_TAG="mjbright/kubeview:0.1"

docker build -t $IMAGE_TAG -f Dockerfile  .

kind load docker-image $IMAGE_TAG


