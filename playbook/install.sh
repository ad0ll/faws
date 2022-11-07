#!/bin/bash

# This is a simple script that installs all software needed to run a mainnet node client
# It's been tested against debian 11, but should work against most debian based systems
# Non-debian systems may work, but note that the node software makes
# This will be converted to a playbook in the future

set -e

apt install -y git curl python3-pip
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
source ~/.bashrc
source ~/.nvm/nvm.sh
#PIP_PATH=$(python3 -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())")
COORDINATOR_ID=$(cat ../contract/neardev/dev-account) #TODO Swap this for the actual coordinator id
PIP_PATH=$(python3 -m site --user-site)
export PATH="$PATH:$PIP_PATH:$HOME/.local/bin"
echo $PATH
echo $PIP_PATH
install_pip() {
  if [[ -z "$(which pip)" ]]; then
    echo "Installing pip"
#    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
#    python3 get-pip.py --user
    pip3 install --user setuptools wheel
  fi
}

install_ansible() {
  if [[ -z "$(which ansible)" ]]; then
    echo "Installing ansible"
#    python3 -m pip install --user ansible
  pip3 install ansible
  #pip3 install ansible-lint
  pip3 install ansible-modules-pm2
  fi
}


echo "Installing ansible..."
install_pip
install_ansible


git clone git@github.com:ad0ll/near-isnt-decentralized.git
cd near-isnt-decentralized/playbook


echo "Installing tools"
#ansible-playbook install-tools.yaml --ask-become-pass
ansible-playbook install-tools.yaml --become-password-file .password

#We now have near installed and can check that the provided contract, account id, and node name/id are all valid
source ~/.nvm/nvm.sh

#read -s "What is your near account id? (ex: account1.testnet): "
#read -s "What is the name of your node? (ex: node1): "
#ansible-playbook install-client.yaml --become-password-file .password
#Check if key file exists, and if it doesn't, run near login
#near login --accountId garbage8.testnet
#cd /home/parallels/near-isnt-decentralized2/execution-client
#near login
#pm2 startup
#pm2 restart index
#pm2 save
