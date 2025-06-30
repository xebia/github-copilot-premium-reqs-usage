#!/bin/bash

set -e

echo "Setting up node user home directory and permissions"
sudo mkdir -p /home/node/.config/vscode-dev-containers
sudo chown -R node:node /home/node
sudo chmod 755 /home/node
sudo chmod -R 755 /home/node/.config

echo "Installing inotify-tools"
sudo apt update && sudo apt install -y inotify-tools

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/refreshTools.sh"

echo "Installing Node.js dependencies"
npm install

echo "Installing supervisor"
sudo apt-get update && sudo apt-get install -y supervisor