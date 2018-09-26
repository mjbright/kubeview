
PORTS="8002 9001"

#RHOST="ldlc"
RHOST="192.168.0.40"
RUSER=mjb
RLOGIN=${RUSER}@${RHOST}

MHOST=home
MUSER=mjb
MLOGIN=${MUSER}@${MHOST}

FORWARDING1="";
FORWARDING2="";

VERBOSE=""

SERVICE_IP=127.0.0.1

while [ ! -z "$1" ];do
    case $1 in
        -v) VERBOSE="-v";;
        -L)
            #ssh -Nv -L 18002:127.0.0.1:8002 -L 19001:127.0.0.1:9001 -J home mjb@ldlc 
            FORWARDING1="";
            FORWARDING2="";
            for PORT in $PORTS; do
                let LPORT=PORT+10000;
                let MPORT=PORT+20000;
                let RPORT=PORT;

                #FORWARDING1+=" -L $LPORT:${RHOST}:$PORT"
                FORWARDING1+=" -L $LPORT:127.0.0.1:$MPORT"; FORWARDING2+=" -L $MPORT:127.0.0.1:$RPORT"
            done
            ;;

        -sip) shift; SERVICE_IP=$1;
            ;;

        3[0-9][0-9][0-9][0-9]) PORT=$1;
            PORTS+=$PORT

            let LPORT=PORT;
            let MPORT=PORT+20000;
            let RPORT=PORT;
            #[ ! -z "$FORWARDING1" ] && FORWARDING1+=" -L $LPORT:${RHOST}:$PORT"
            [ ! -z "$FORWARDING1" ] && { FORWARDING1+=" -L $LPORT:127.0.0.1:$MPORT"; FORWARDING2+=" -L $MPORT:${SERVICE_IP}:$RPORT"; }
            ;;

        [0-9]*) PORT=$1;
            PORTS+=$PORT

            let LPORT=PORT+10000;
            let MPORT=PORT+20000;
            let RPORT=PORT;
            #[ ! -z "$FORWARDING1" ] && FORWARDING1+=" -L $LPORT:${RHOST}:$PORT"
            [ ! -z "$FORWARDING1" ] && { FORWARDING1+=" -L $LPORT:127.0.0.1:$MPORT"; FORWARDING2+=" -L $MPORT:127.0.0.1:$RPORT"; }
            ;;

    esac
    shift
done

if [ -z "$FORWARDING1" ];then
    set -x
    ssh $VERBOSE -qt ${MLOGIN} ssh $VERBOSE -qt "${RLOGIN} tmux a -t work  || tmux new-session -s work"
    set +x
else
    #ssh -N $VERBOSE $FORWARDING1 -qt ${MLOGIN} ssh $VERBOSE $FORWARDING2 -qt $RLOGIN
    #ssh $VERBOSE -N $FORWARDING1 ${MLOGIN}
    set -x
    ssh -qt $VERBOSE $FORWARDING1 ${MLOGIN} ssh $FORWARDING2 $VERBOSE -N $RLOGIN
    set +x
fi


#http://127.0.0.1:31036 </button>
#http://127.0.0.1:31036" allowtransparency="yes" scrolling="no" style="width:820px; height:26px; position:absolute; left:380px;top:0px;margin:0;padding:0;" > </iframe>
#http://127.0.0.1:9001" allowtransparency="yes" scrolling="yes" style="width:1000px; height:90px; position:absolute; left:2px;top:0px;margin:0;padding:0;" > </iframe>
#http://127.0.0.1:8002" allowtransparency="yes" scrolling="yes" style="width:1000px; height:900px; position:absolute; left:2px;top:0px;margin:0;padding:0;" > </iframe>

#ssh -Nv -L 18002:127.0.0.1:8002 -L 19001:127.0.0.1:9001 -J home mjb@ldlc 
# ssh -qt -L 18002:127.0.0.1:28002 -L 19001:127.0.0.1:29001 -L 41896:127.0.0.1:51896 home ssh -L 28002:127.0.0.1:8002 -L 29001:127.0.0.1:9001 -L 51896:127.0.0.1:31896 -N mjb@192.168.0.40
