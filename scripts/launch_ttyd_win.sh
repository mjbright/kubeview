#!/usr/bin/env bash

#TTYD_OPTIONS="-O -m 1 -S -d 7"
TTYD_OPTIONS="-O -m 1 -d 7"

TTYD_DIR=~/z/bin/win64/ttyd

die() {
    echo "$0: die - $*" >&2
    exit 1
}

# cd $(dirname $0)

[ ! -d $TTYD_DIR ] && die "No such dir <$TTYD_DIR>"
# cd ~/z/bin/win64/ttyd/
cd $TTYD_DIR

pwd
ls -altr

[ ! -x ttyd.exe ] && die "No such executable <ttyd.exe>"
[ ! -f ttyd.bashrc ] && die "No such rc file <ttyd.bashrc>"

export XXX=yyy
CMD="/c/tools/msys64/msys2.exe ./ttyd.exe $TTYD_OPTIONS -p 9001 bash --rcfile ttyd.bashrc"

echo $CMD
$CMD






