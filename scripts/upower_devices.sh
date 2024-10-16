#!/bin/bash
devices=$(upower -e)

json="["

for device in $devices; do
    details=$(upower -i "$device")
    json+="{"

    while IFS= read -r line; do
        if [[ "$line" =~ ^[[:space:]]*([^:]+):[[:space:]]*(.*)$ ]]; then
          key=$(echo "${BASH_REMATCH[1]}" | xargs | sed 's/ /_/g')
          value=$(echo "${BASH_REMATCH[2]}" | xargs)

          json+="\"$key\": \"$value\","
        fi
    done <<< "$details"

    json=${json%,}
    json+="},"
done

json=${json%,}
json+="]"

echo $json
