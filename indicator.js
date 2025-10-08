import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

import * as Constants from './constants.js';

export const IndicatorController = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Hyperx battery Indicator'));
            this._container = new St.BoxLayout();
            this._labels = [];
            this._icons = [];
            this._currentClass = []
            this._prevDevicesSettings = [];
            this._addSettingsButton();
        }

        refresh(devices) {

            const devicesSettings = devices.map(({ mac, icon, fillEffect }) => ({ mac, icon, fillEffect }));
            if (JSON.stringify(devicesSettings) !== JSON.stringify(this._prevDevicesSettings)) {
                this._container.remove_all_children();
                this._addBoxes(devices);
            }

            devices.forEach((device, index) => {
                this.setPercentLabel(device.batteryPercentage, index);
                if (this._icons[index] && this._icons[index].updateFill) {
                    this._icons[index].updateFill(device.percentage);
                }
            });

            this._prevDevicesSettings = devicesSettings;
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
            const box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
            if (device && device.fillEffect) {
                this._icons[index] = this._createFillableIcon(device);
            } else {
                this._icons[index] = this._getBoxIcon(device);
            }

            this._labels[index] = this._getBoxLabel();

            box.add_child(this._icons[index]);
            box.add_child(this._labels[index]);

            return box;
        }

        _getBoxLabel() {
            const label = new St.Label({
                y_align: Clutter.ActorAlign.CENTER
            });
            label.set_style('font-size: 12px;');

            return label;
        }

        _getBoxIcon(device) {
            let container = new St.Widget({
                layout_manager: new Clutter.BinLayout(),
            });

            const icon = new St.Icon({
                icon_name: device.icon || 'battery-full-symbolic',
                style_class: 'system-status-icon',
            });
            icon.set_style('margin-right: 0px;');

            container.add_child(icon);
            return container;
        }

        setPercentLabel(percent, index) {
            if (this._labels[index]) {
                this._labels[index].text = (percent || '').trim();
            }
        }

        _createFillableIcon(device) {
            let container = new St.Widget({
                layout_manager: new Clutter.BinLayout(),
            });

            let base = new St.Icon({
                icon_name: device.icon || 'battery-full-symbolic',
                style_class: 'system-status-icon',
                style: 'color: gray; margin-right: 0px;',
            });

            const getColor = (percentage) => {
                if (percentage <= 15) {
                    return '#ff0000';
                } else if (percentage <= 49) {
                    return '#ff6600';
                } else if (percentage <= 65) {
                    return '#ffcc00';
                } else if (percentage <= 80) {
                    return '#66cc33';
                } else if (percentage <= 100) {
                    return '#00aa00';
                } else {
                    return 'gray';
                }
            }

            let fill = new St.Icon({
                icon_name: device.icon || 'battery-full-symbolic',
                style_class: 'system-status-icon',
                style: `color: ${getColor(device.percentage)}; margin-right: 0px;`,
            });

            container.add_child(base);
            container.add_child(fill);

            const updateFill = (percentage) => {
                let color = getColor(percentage);
                fill.set_style(`color: ${color}; margin-right: 0px;`);


                let percent = Math.max(0, Math.min(1, percentage / 100));

                GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                    let [width, height] = fill.get_preferred_size();
                    if (width > 0 && height > 0) {
                        let filledHeight = height * percent;
                        fill.set_clip(0, height - filledHeight, width, filledHeight);
                    }
                    return GLib.SOURCE_REMOVE;
                });
            }

            updateFill(device.percentage);

            container.updateFill = updateFill;
            return container;
        }
    }
);
