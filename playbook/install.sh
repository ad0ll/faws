#!/bin/bash

# This is a simple script that installs all software needed to run a mainnet node client
# It's been tested against Debian 11, Raspbian and MacOS Ventura, and it should work against most debian based systems

# Run with sudo su - root -s $HOME/install.sh
# One line install is (Replace ACCOUNT_ID, NODE_NAME, and WEBSOCKET_URL with your own values):
# (testnet) curl -o- https://raw.githubusercontent.com/ad0ll/faws/main/playbook/install.sh | ACCOUNT_ID=faws-demo1 NODE_NAME=vm-node1 WEBSOCKET_URL=http://127.0.0.1:8000/ws bash
# (mainnet) curl -o- https://raw.githubusercontent.com/ad0ll/faws/main/playbook/install.sh | ACCOUNT_ID=faws-demo1 NODE_NAME=vm-node1  bash
REPO_NAME="faws"
REPO_DIR="faws"
COORDINATOR_ID="dev-1668375639392-20530569635416"
PIP_PATH=$(python3 -m site --user-site)
ACCOUNT_ID=$ACCOUNT_ID
NODE_NAME=$NODE_NAME
WEBSOCKET_URL=$WEBSOCKET_URL

if [[ -z "$ACCOUNT_ID" || -z "$NODE_NAME" || -z "$WEBSOCKET_URL" ]]; then
    echo "Please set ACCOUNT_ID, NODE_NAME, and WEBSOCKET_URL"
    exit 1
fi

ARM6=$(uname -m | grep armv6l) #Raspberry Pi Zero 1, older Pi models
GPU_SUPPORT=$(lspci | grep -i nvidia)
export PATH="$PATH:$PIP_PATH:$HOME/.local/bin"
apt install -y git curl python3-pip

if [[ -n "$WIPE" ]]; then
  rm -rf "${HOME:?}/$REPO_DIR"
  rm -rf "$HOME/.nvm"
  rm -rf "$HOME/.ansible"
fi

install_nvm() {
  if [[ -n "$ARM6" ]]; then
    # https://github.com/sdesalas/node-pi-zero
    echo "Skipping nvm install on arm6 (Pi Zero), installing node manually"
    wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v16.3.0.sh | bash
    return
  fi
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
  git clone https://github.com/ad0ll/$REPO_NAME.git $REPO_DIR
fi
cd "$REPO_DIR/playbook" || exit
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


#
#if [[ -z "$DEV_BOX" ]]; then
#  WEBSOCKET_URL=ws://localhost:8000/ws
#else
#  read -sr "What is the url for the websocket relay? (ex: ws://localhost:8000/ws): " WEBSOCKET_URL
#fi

#Check if key file exists, and if it doesn't, run near login
#ansible-playbook install-client.yaml --become-password-file .password --extra-vars "account_id=$ACCOUNT_ID node_name=$NODE_NAME coordinator_id=$COORDINATOR_ID websocket_url=$WEBSOCKET_URL repo_dir=$REPO_DIR home=$HOME" --verbose
ansible-playbook install-client.yaml --ask-become-pass --extra-vars "account_id=$ACCOUNT_ID node_name=$NODE_NAME coordinator_id=$COORDINATOR_ID websocket_url=$WEBSOCKET_URL repo_dir=$REPO_DIR home=$HOME" --verbose

cd "$HOME/$REPO_DIR/execution-client" || exit


# https://docs.nvidia.com/ai-enterprise/deployment-guide/dg-docker.html
if [[ -n "$GPU_SUPPORT" ]]; then
  distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
  curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
  curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
  apt-get update && apt-get install -y nvidia-container-toolkit
fi
yarn
yarn tsc
yarn start

#near login
#pm2 startup
#pm2 restart index
#pm2 save
