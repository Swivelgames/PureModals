#!/bin/bash

# HUGE thanks to Dave Dopson FOR http://stackoverflow.com/questions/59895/can-a-bash-script-tell-what-directory-its-stored-in
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  BIN_DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$BIN_DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
CWD="$( cd -P "$( dirname "$SOURCE" )" && git rev-parse --show-toplevel )"

java -jar $CWD/bin/compiler.jar --compilation_level WHITESPACE_ONLY --js $CWD/extend.js --js_output_file $CWD/extend.min.js #--create_source_map=$CWD/javascript-assets/library/minified/pure-modals.min.map
wait $!