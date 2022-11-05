#!/bin/bash

# This is a simple script that installs all software needed to run a mainnet node client
# It's been tested against debian 11, but should work against most debian based systems
# Non-debian systems may work, but note that the node software makes
# This will be converted to a playbook in the future

#alias install-cmd="apt install -y"

#Below will likely prompt the user for the a sudoer password
#su - root

apt install -y git curl python3-pip
#PIP_PATH=$(python3 -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())")
PIP_PATH=$(python3 -m site --user-site)
export PATH="$PATH:$PIP_PATH"
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
  fi
}

install_pip
install_ansible
ansible-playbook playbook.yaml

