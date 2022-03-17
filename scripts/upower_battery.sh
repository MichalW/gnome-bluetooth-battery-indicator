#!/bin/bash

# sed explaination: https://stackoverflow.com/questions/13534306/how-can-i-set-the-grep-after-context-to-be-until-the-next-blank-line
# grep explaination: https://stackoverflow.com/questions/1546711/can-grep-show-only-words-that-match-search-pattern
percent=$(upower --dump | sed -n "/$1/,/^$/p" | grep -oE '[0-9]{1,2}%')
connected=$(bluetoothctl info $1 | grep "Connected" | cut -d ' ' -f2)

if [[ $connected == "yes" ]]; then
  if [ -z "$percent" ]; then
    echo "?"
  else
    echo "$percent"
  fi
elif [[ $connected == "no" ]]; then
  echo "off"
else
  echo "?"
fi
