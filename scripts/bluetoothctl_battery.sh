#!/bin/bash

percent=$(bluetoothctl info $1 | grep "Battery Percentage" | cut -d ' ' -f4 | sed 's/^.//;s/.$//')
connected=$(bluetoothctl info $1 | grep "Connected" | cut -d ' ' -f2)

if [[ $connected == "yes" ]]; then
  if [ -z "$percent" ]; then
    echo "?"
  else
    echo "$percent%"
  fi
elif [[ $connected == "no" ]]; then
  echo "off"
else
  echo "?"
fi