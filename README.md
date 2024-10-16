# About

Gnome-Shell extension displaying battery percentage for bluetooth devices

https://extensions.gnome.org/extension/3991/bluetooth-battery/


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
