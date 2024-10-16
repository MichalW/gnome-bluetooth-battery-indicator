import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {UPowerController} from './UPowerController.js';
import {IndicatorController} from './indicator.js';
import {SettingsController} from './settings.js';

export default class BluetoothBatteryIndicatorExtension extends Extension {
    enable() {
        this._controller = new UPowerController(this.dir);
        this._settings = new SettingsController(this.getSettings());
        this._indicator = new IndicatorController();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._getRefreshButton();

        this._loop = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, this._runLoop.bind(this));
    }

    _runLoop() {
        this._refresh();

        const interval = this._settings.getInterval();
        this._loop = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval * 60, this._runLoop.bind(this));
    }

    _getRefreshButton() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
        refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._indicator._addMenuItem(refreshItem);
    }

    async _refresh() {
        const settingsDevices = this._settings.getDevices();

        const settingsHideIndicator = this._settings.getHideIndicator();
        const uPowerDevices = await this._controller.getDevices();

        const devices = this._mergeDevices(settingsDevices, uPowerDevices);
        const devicesToShow = devices.filter((device) => device.isConnected && device.isActive);

        this._indicator.refresh(devicesToShow);

        this._settings.setDevices(devices);

        if (settingsHideIndicator) {
            Main.panel.statusArea[this.uuid].visible = !!devices.length;
        }
    }

    _mergeDevices(settingsDevices, uPowerDevices) {
        const filterByMac = (mac) => (device) => device.mac === mac;
        const newDevices = uPowerDevices.filter((device) => !settingsDevices.some(filterByMac(device.mac)));

        return [
            ...newDevices,
            ...settingsDevices.map((device) => ({
                ...device,
                ...uPowerDevices.find(filterByMac(device.mac)),
            })),
        ];
    }

    disable() {
        GLib.Source.remove(this._loop);

        this._controller.destroy();
        this._controller = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}
