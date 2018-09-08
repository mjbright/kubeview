#!/bin/bash

# On Ubuntu: ttyd -i enp3s0 -O -m 1 -S -d 14 -p 9001 bash

#TTYD_OPTIONS="-O -m 1 -S -d 7"
TTYD_OPTIONS="-O -m 1 -d 7"

die() {
    echo "$0: die - $*" >&2
    exit 1
}

cd $(dirname $0)/..
pwd

#SERVE_IFACE=lo0
SERVE_IFACE=lo
SERVE_PORT=9001

while [ ! -z "$1" ];do
    case $1 in
        -r)   # Access remotely:
            SERVE_IFACE=$(ip a | awk '!/[0-9]: lo/ && /^[0-9]: / { FS=":"; $0=$2; print $1; exit 0; }')
            ;;

        *)  die "Bad option <$1>";;
    esac
    shift
done


[ -z "$SERVE_IFACE" ] &&
    SERVE_IFACE=$(ip a | awk '/[0-9]: lo/ { FS=":"; $0=$2; print $1; exit 0; }')

set -x
ttyd -i $SERVE_IFACE -p $SERVE_PORT $TTYD_OPTIONS bash





