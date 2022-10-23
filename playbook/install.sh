#!/bin/sh

# This is a simple script that installs ansible and then runs the playbook.

if [[ -z which pip ]]; then
  echo "Installing pip"
  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  python3 get-pip.py --user
fi

if [[ -z which ansible ]]; then
  echo "Installing ansible"
  pip3 install ansible --user
fi

ansible-playbook playbook.yaml