
# See here for info on 'kubectl proxy' command:
#   https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#proxy

#PORT=8001
PORT=8002

#kubectl proxy --www=/Users/mjb/src/git/brendandburns.gcp-live-k8s-visualizer --www-prefix=/my-mountpoint/ --api-prefix=/api/

SRC_DIR=$(dirname $0)/..

die() {
    echo "$0: die - $*" >&2
    exit 1
}

OPTS=""

while [ ! -z "$1" ];do
    case $1 in
        -p)   # Specify other port for experiments:
              shift; PORT=$1;;

        -r)   # Access remotely:
              IP=$(ip a | awk '!/127.0.0.1/ && / inet / { FS="/"; $0=$2; print $1; exit(0); }')
              if [ ! -z "$2" ]; then
                  shift; CLIENT_IP=$1
              else
                  CLIENT_IP=0.0.0.0
	      fi
              #OPTS+="--accept-hosts='^localhost$,^127\.0\.0\.1$,$CLIENT_IP'"
              OPTS+=" --address=$IP --accept-hosts='^${CLIENT_IP}$'"
	      # --accept-hosts='^localhost$,^127\.0\.0\.1$,^\[::1\]$'
	      ;;

        -mjb) SRC_DIR=~/src/git/GIT_mjbright/codeeurope-microservices/live-k8s-visualizer ;;
        \.)   SRC_DIR=.;;
        -l)   SRC_DIR=~/src/git/larrycai.gcp-live-k8s-visualizer;;

	*)    die "Bad option <$1>";;
    esac
    shift
done

add_source_tooltip() {
   SOURCEURL=$(git remote -v 2>/dev/null | sed -e '1d' -e 's/.*github.com/https:\/\/github.com/' -e 's/ .*//')
   [ -z "$SOURCEURL" ] && SOURCEURL=$PWD

   # TODO:
   # Separate out config.js.template, create here config.js
   # include config.js from index.html

   TOOLTIP="Sourced from $SOURCEURL"
   #echo "SOURCEURL='$SOURCEURL'"
   #echo "TOOLTIP='$TOOLTIP'"

   # Get/show context/cluster in toplinemenu
   # - to get context: kubectl config current-context
   # - to get cluster: kubectl config current-context | sed 's/.*@//'
   CONTEXT=$(kubectl config current-context);
   CLUSTER=${CONTEXT#*@};
   #echo $CLUSTER
   sed \
       -e "s_data-tip='TOOLTIP'_data-tip='$TOOLTIP'_" \
       -e "s_sourceURL='SOURCEURL'_sourceURL='$SOURCEURL'_" \
       -e "s_CLUSTERNAME='CLUSTERNAME'_CLUSTERNAME='$CLUSTER'_" \
		   index.html.template > index.html

   ls -al index.html
   [ ! -s index.html ] && die "Failed to create index.html from template"
}

add_source_tooltip

#kubectl proxy $OPTS  --www=$SRC_DIR --www-prefix=/ --api-prefix=/api/ --port $PORT
set -x
kubectl proxy $OPTS  --www=$SRC_DIR --www-prefix=/static/ --port $PORT
set +x


