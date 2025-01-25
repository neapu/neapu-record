#!/bin/bash
set -e
SCRIPT_PATH=$(readlink -f "$0")
WORKSPACE=$(dirname "$SCRIPT_PATH")/..
BUILD_DIR=$WORKSPACE/temp
WEB_DIR=$WORKSPACE/web

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Build the web app
cd $BUILD_DIR
git clone https://github.com/neapu/neapu-record-web.git
cd neapu-record-web
npm install
npm run build

# Copy the built files to the web directory
rm -rf $WEB_DIR
cp -r ./dist $WEB_DIR

# Clean up
rm -rf $BUILD_DIR
