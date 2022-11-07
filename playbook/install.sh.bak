#!/bin/bash

# This is a simple script that installs all software needed to run a mainnet node client
# It's been tested against debian 11, but should work against most debian based systems
# Non-debian systems may work, but note that the node software makes
# This will be converted to a playbook in the future

# Run with sudo su - root -s $HOME/install.sh
set -e


REPO_NAME="near-isnt-decentralized"
REPO_DIR="near-isnt-decentralized3"
COORDINATOR_ID="dev-1667851730608-70663242970224"
PIP_PATH=$(python3 -m site --user-site)
export PATH="$PATH:$PIP_PATH:$HOME/.local/bin"
apt install -y git curl python3-pip

if [[ -n "$WIPE" ]]; then
  rm -rf "$HOME/$REPO_DIR"
  rm -rf "$HOME/.nvm"
  rm -rf "$HOME/.ansible"
fi

install_nvm() {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
  source "$HOME/.bashrc"
  source "$HOME/.nvm/nvm.sh"
  nvm install stable
  nvm alias default stable
  nvm use default
}

install_pip() {
  if [[ -z "$(which pip)" ]]; then
    echo "Installing pip"
    pip3 install --user setuptools wheel
  fi
}

install_ansible() {
  if [[ -z "$(which ansible)" ]]; then
    echo "Installing ansible"
    pip3 install ansible
    pip3 install ansible-modules-pm2
  fi
}

install_development_tools() {
  echo "Installing development tools"
  pip3 install ansible-lint
}

install_nvm
install_pip
install_ansible

if [[ ! -d "$HOME/$REPO_DIR" ]]; then
  git clone git@github.com:ad0ll/$REPO_NAME.git $REPO_DIR
fi
cd "$REPO_DIR/playbook"
git pull origin main

echo "Installing tools"
ansible-playbook install-tools.yaml --ask-become-pass --extra-vars "home=$HOME"
#ansible-playbook install-tools.yaml --become-password-file .password --extra-vars "home=$HOME"

#We now have near installed and can check that the provided contract, account id, and node name/id are all valid

if [[ ! -d $HOME/.near-credentials ]]; then
  near login
fi

#read -sr "What is your near account id? (ex: account1.testnet): " ACCOUNT_ID
#read -sr "What is the name of your node? (ex: node1): " NODE_NAME
#read -sr "Is this a development box? (y/n): " DEV_BOX
#read -sr "What websocket are you listening to? (ex: ws://localhost:800/ws): " WEBSOCKET_URL

ACCOUNT_ID=garbage9.testnet
NODE_NAME=node1
DEV_BOX=y
WEBSOCKET_URL=$WEBSOCKET_URL
#
#if [[ -z "$DEV_BOX" ]]; then
#  WEBSOCKET_URL=ws://localhost:8000/ws
#else
#  read -sr "What is the url for the websocket relay? (ex: ws://localhost:8000/ws): " WEBSOCKET_URL
#fi

#Check if key file exists, and if it doesn't, run near login
#ansible-playbook install-client.yaml --become-password-file .password --extra-vars "account_id=$ACCOUNT_ID node_name=$NODE_NAME coordinator_id=$COORDINATOR_ID websocket_url=$WEBSOCKET_URL repo_dir=$REPO_DIR home=$HOME" --verbose
ansible-playbook install-client.yaml --ask-become-pass --extra-vars "account_id=$ACCOUNT_ID node_name=$NODE_NAME coordinator_id=$COORDINATOR_ID websocket_url=$WEBSOCKET_URL repo_dir=$REPO_DIR home=$HOME" --verbose

cd "$HOME/$REPO_DIR/execution-client"
yarn
yarn tsc
yarn start
#near login
#pm2 startup
#pm2 restart index
#pm2 save
