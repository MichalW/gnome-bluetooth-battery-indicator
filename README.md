# About

Gnome-Shell extension displaying battery percentage for bluetooth devices

https://extensions.gnome.org/extension/3991/bluetooth-battery/

## Requirements

* bluez
* python3 (ubuntu: `python3-dev`, fedora: `python3-devel`)
* libbluetooth (ubuntu: `libbluetooth-dev`, fedora: `bluez-libs`)
* pybluez (ubuntu: `python3-bluez`, fedora: `python3-bluez`

Ubuntu:
```
sudo apt install bluez libbluetooth-dev python3-dev python3-bluez
```

Fedora:
```
sudo dnf install bluez bluez-libs python3-devel python3-bluez
```

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

## Debug
journalctl -f -o cat /usr/bin/gnome-shell


## Sources
### This script is based on the following sources

https://github.com/TheWeirdDev/Bluetooth_Headset_Battery_Level

https://github.com/bjarosze/gnome-bluetooth-quick-connect
