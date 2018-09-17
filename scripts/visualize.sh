
# See here for info on 'kubectl proxy' command:
#   https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#proxy

#PORT=8001
PORT=8002

TTYDPORT=9001

#kubectl proxy --www=/Users/mjb/src/git/brendandburns.gcp-live-k8s-visualizer --www-prefix=/my-mountpoint/ --api-prefix=/api/

SCRIPT=$(readlink -f $0)
SCRIPT_DIR=${SCRIPT%/*}
SRC_DIR=${SCRIPT_DIR%/*}

HOST=$(hostname)

#RUN_DIR=$SRC_DIR/tmp/$HOST
RUN_DIR=$SRC_DIR/
echo $RUN_DIR
#exit 0

INDEX_HTML=$RUN_DIR/$HOST.html
DASHBOARD_HTML=$RUN_DIR/$HOST.dashboard.html

die() {
    echo "$0: die - $*" >&2
    exit 1
}

OPTS=""

while [ ! -z "$1" ];do
    case $1 in
        -p)   # Specify other port for experiments:
              shift; PORT=$1; VISU_PORT=$PORT;;

        -L)   # Specify other port for experiments:
              shift; VISU_PORT=$1;;

        -t)   # Specify ttyd port for embedded terminal:
              shift; TTYDPORT=$1;;

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

# Take into account ssh tunneling:
[ -z "$VISU_PORT" ] && VISU_PORT=$PORT

VISUURL=http://127.0.0.1:$VISU_PORT/static/$HOST.html
TTYDURL=http://127.0.0.1:$TTYDPORT

modify_template() {
    HTML=$1; shift;
    TEMPLATE=$1; shift;

    sed \
        -e "s_data-tip='TOOLTIP'_data-tip='$TOOLTIP'_" \
        -e "s_sourceURL='SOURCEURL'_sourceURL='$SOURCEURL'_" \
        -e "s_CLUSTERNAME='CLUSTERNAME'_CLUSTERNAME='$CLUSTER'_" \
        -e "s_TTYDURL_${TTYDURL}_" \
        -e "s_VISUURL_${VISUURL}_" \
            $TEMPLATE > $HTML

    ls -al $HTML
    [ ! -s $HTML ] && die "Failed to create $HTML from template"
}

add_source_tooltip() {
   # Sometimes (git) failing under cygwin:
   # SOURCEURL=$(git remote -v 2>/dev/null | sed -e '1d' -e 's/.*github.com/https:\/\/github.com/' -e 's/ .*//')

   SOURCEURL=$(awk '/url = / { print $3; }' .git/config |
               sed -e 's/.*github.com/https:\/\/github.com/' -e 's/ .*//')
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

    modify_template $INDEX_HTML     index.html.template
    modify_template $DASHBOARD_HTML dashboard.html.template
}

add_source_tooltip
echo SOURCEURL=$SOURCEURL
echo VISUURL=$VISUURL
echo TTYDURL=$TTYDURL


cd $RUN_DIR/
pwd
set -x
kubectl proxy $OPTS  --www=. --www-prefix=/static/ --port $PORT
set +x


