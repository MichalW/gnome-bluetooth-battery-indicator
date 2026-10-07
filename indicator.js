import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

import * as Constants from './constants.js';

export const IndicatorController = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Bluetooth battery Indicator'));
            this._container = new St.BoxLayout();
            this._labels = [];
            this._icons = [];
            this._prevDevicesSettings = null;

            this._devicesSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._devicesSection);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            this._addSettingsButton();
        }

        refresh(devices, menuDevices = devices) {
            const devicesSettings = devices.map(({mac, icon}) => ({mac, icon}));

            if (JSON.stringify(devicesSettings) !== JSON.stringify(this._prevDevicesSettings)) {
                this._container.remove_all_children();
                this._addBoxes(devices);
            }

            devices.forEach((device, index) => {
                this.setPercentLabel(device.batteryPercentage, index);
            });

            this._prevDevicesSettings = devicesSettings;

            this._updateMenuDevices(menuDevices);
        }

        _updateMenuDevices(devices) {
            this._devicesSection.removeAll();

            const devicesWithBattery = devices.filter((device) => device.isConnected && device.batteryPercentage);

            if (!devicesWithBattery.length) {
                const item = new PopupMenu.PopupMenuItem(_('No connected devices'), {
                    reactive: false,
                    can_focus: false,
                });
                this._devicesSection.addMenuItem(item);
                return;
            }

            devicesWithBattery.forEach((device) => {
                const name = device.name || _('Device');
                const text = `${name}: ${device.batteryPercentage}`;
                const item = new PopupMenu.PopupMenuItem(text, {
                    reactive: false,
                    can_focus: false,
                });
                const icon = new St.Icon({
                    icon_name: device.icon || device.defaultIcon || 'battery-full-symbolic',
                    style_class: 'popup-menu-icon',
                });
                item.insert_child_at_index(icon, 0);
                this._devicesSection.addMenuItem(item);
            });
        }

        _addMenuItem(item) {
            this.menu.addMenuItem(item);
        }

        _addSettingsButton() {
            const settings = new PopupMenu.PopupMenuItem(_('Settings'));
            settings.connect('activate', () => {
                Util.spawn(['gnome-extensions', 'prefs', Constants.UUID]);
            });
            this._addMenuItem(settings);
        }

        _addBoxes(devices) {
            if (!devices.length) {
                const box = this._getBox({}, 0);
                this._container.add_child(box);
            } else {
                devices.forEach((device, index) => {
                    const box = this._getBox(device, index);
                    this._container.add_child(box);
                });
            }

            this.add_child(this._container);
        }

        _getBox(device, index) {
            const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});

            this._icons[index] = this._getBoxIcon(device);
            this._labels[index] = this._getBoxLabel();

            box.add_child(this._icons[index]);
            box.add_child(this._labels[index]);

            return box;
        }

        _getBoxLabel() {
            const label = new St.Label({
                y_align: Clutter.ActorAlign.CENTER
            });
            label.set_style('margin-right: 5px;');

            return label;
        }

        _getBoxIcon(device) {
            const icon = new St.Icon({
                icon_name: device.icon || 'battery-full-symbolic',
                style_class: 'system-status-icon',
            });
            icon.set_style('margin-right: 0px;');

            return icon;
        }

        setPercentLabel(percent, index) {
            if (this._labels[index]) {
                this._labels[index].text = (percent || '').trim();
            }
        }
    }
);
