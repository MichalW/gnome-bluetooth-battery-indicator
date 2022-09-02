# About

Gnome-Shell extension displaying battery percentage for bluetooth devices

https://extensions.gnome.org/extension/3991/bluetooth-battery/

## Requirements

* bluez
* python3 (ubuntu: `python3-dev`, fedora: `python3-devel`)
* libbluetooth (ubuntu: `libbluetooth-dev`, fedora: `bluez-libs`)
* pybluez (ubuntu: `python3-bluez`, fedora: `python3-bluez`
* `bleak` (needed for AirPods support) - `pip3 install bleak`

Ubuntu:
```
sudo apt install bluez libbluetooth-dev python3-dev python3-bluez
```

Fedora:
```
sudo dnf install bluez bluez-libs python3-devel python3-bluez
```

## A note about AirPods support

Currently, this extension uses [AirStatus](https://github.com/matan129/AirStatus) in order to find out the batter level
of AirPods devices.

Due to a limitation of this utility, there's no option to filter the device by its MAC address.
This means that in the case in which there are more than one AirPods pair nearby, the batter level displayed might be
of any of them.

## Manual Installation

1. Clone the repo
```sh
git clone git@github.com:MichalW/gnome-bluetooth-battery-indicator.git
```

2. Init submodules
```sh
git submodule update --init
```

3. Copy to extensions
```sh
cp -R gnome-bluetooth-battery-indicator ~/.local/share/gnome-shell/extensions/bluetooth-battery@michalw.github.com
```

## Troubleshoot

Show debug log of this plugin: `journalctl -f -o cat /usr/bin/gnome-shell`

### If it failed to show battery percentage

if `Get battery levels using bluetoothctl` is enabled, run this script to see the error message: <https://github.com/MichalW/gnome-bluetooth-battery-indicator/blob/master/scripts/bluetoothctl_battery.sh>

if `Get battery levels using bluetoothctl` is disabled, run this script to see the error message: <https://github.com/TheWeirdDev/Bluetooth_Headset_Battery_Level/blob/master/bluetooth_battery.py>


## Sources
### This script is based on the following sources

* https://github.com/TheWeirdDev/Bluetooth_Headset_Battery_Level
* https://github.com/matan129/AirStatus
* https://github.com/bjarosze/gnome-bluetooth-quick-connect
