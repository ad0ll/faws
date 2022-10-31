#!/bin/sh

# This is a simple script that installs all software needed to run a mainnet node client
# It's been tested against debian 11, but should work against most debian based systems
# Non-debian systems may work, but note that the node software makes
# This will be converted to a playbook in the future

alias install="apt install -y"

#Below will likely promrt the user for the a sudoer password
su - root

install_pip() {
  if [[ -z $(which pip) ]]; then
    echo "Installing pip"
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py --user
  fi
}

install_ansible() {
  if [[ -z $(which ansible) ]]; then
    echo "Installing ansible"
    pip3 install ansible --user
  fi
}

install_system() {
  install git curl wget unzip
}
#ansible-playbook playbook.yaml

apt-get clean autoclean
apt-get autoremove --yes
rm -rf /var/lib/{apt,dpkg,cache,log}/
