import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Utils from './utils.js';
import {BluetoothController} from './bluetooth.js';
import {PYTHON_SCRIPT_PATH, BTCTL_SCRIPT_PATH, UPOWER_SCRIPT_PATH, TOGGLE_SCRIPT_PATH} from './constants.js';
import {IndicatorController} from './indicator.js';
import {SettingsController} from './settings.js';

export default class BluetoothBatteryIndicatorExtension extends Extension {
    enable() {
        this._controller = new BluetoothController();
        this._settings = new SettingsController(this.getSettings());
        this._indicator = new IndicatorController();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._getRefreshButton();
        this._getForceRefreshButton();

        this._loop = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, this._runLoop.bind(this));

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
            this._connectSignals();
        });
    }

    _connectSignals() {
        this._controller.connectObject('device-changed', () => this._refresh(), this);
    }

    _disconnectSignals() {
        this._controller.disconnectObject(this);
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

    _getForceRefreshButton() {
        const forceRefreshItem = new PopupMenu.PopupMenuItem(_('Force refresh bluetooth'));
        forceRefreshItem.connect('activate', () => {
            this._forceRefresh();
        });
        this._indicator._addMenuItem(forceRefreshItem);
    }

    _refresh(force = false) {
        const settingsDevices = this._settings.getDevices();
        const settingsHideIndicator = this._settings.getHideIndicator();
        const pairedDevices = this._controller.getPairedDevices();
        const devices = this._mergeDevices(settingsDevices, pairedDevices);

        const devicesToShow = devices.filter((device) => (
            device.active && device.isPaired && device.isConnected
        ));

        this._indicator.refresh(devicesToShow);

        devicesToShow.forEach((device, index) => {
            log("[bluetooth-battery-indicator] Using percentage source '" + device.percentageSource
                + "' for device '" + device.name + "' (" + device.mac + ").");

            switch (device.percentageSource) {
                case 'python-script':
                    if (force) {
                        this._toggleBluetoothDevice(device.mac, false, () => {
                            this._getBatteryLevel(device.mac, device.port, index);
                            this._toggleBluetoothDevice(device.mac, true);
                        });
                    } else {
                        this._getBatteryLevel(device.mac, device.port, index);
                    }
                    break;

                case 'bluetoothctl':
                    this._getBatteryLevelBluetoothctl(device.mac, index)
                    break;

                case 'upower':
                    this._getBatteryLevelUpower(device.mac, index);
                    break;

                default:
                    log("[bluetooth-battery-indicator] Unknown percentage source '" + device.percentageSource + "'");
                    throw new TypeError("Unknown percentage source '" + device.percentageSource + "'");
                    break;
            }
        });

        this._settings.setDevices(devices);

        if (settingsHideIndicator) {
            Main.panel.statusArea[this.uuid].visible = !!devicesToShow.length;
        }
    }

    _forceRefresh() {
        this._refresh(true);
    }

    _mergeDevices(settingsDevices, pairedDevices) {
        const filterByMac = (mac) => (device) => device.mac === mac;
        const newDevices = pairedDevices.filter((device) => !settingsDevices.some(filterByMac(device.mac)));
        const defaultProps = { isConnected: false, isPaired: false };

        return [
            ...newDevices,
            ...settingsDevices.map((device) => ({
                ...device,
                ...defaultProps,
                ...pairedDevices.find(filterByMac(device.mac)),
            })),
        ];
    }

    _setPercentFromScript(index) {
        return (result) => {
            const resultArray = result.split(' ');
            const percent = resultArray[resultArray.length - 1];
            this._indicator.setPercentLabel(percent, index);
        };
    }

    _getBatteryLevel(btMacAddress, port, index) {
        const pyLocation = this.dir.get_child(PYTHON_SCRIPT_PATH).get_path();
        const pythonExec = Utils.getPythonExec();

        if (!pythonExec) {
            log('ERROR: Python not found.');
            return;
        }

        const address = port ? `${btMacAddress}.${port}` : btMacAddress;

        Utils.runPythonScript(
          [pythonExec, pyLocation, address],
          this._setPercentFromScript(index)
        )
    }

    _getBatteryLevelBluetoothctl(btMacAddress, index) {
        const shellLocation = this.dir.get_child(BTCTL_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
          [shellLocation, btMacAddress],
          this._setPercentFromScript(index)
        )
    }

    _getBatteryLevelUpower(btMacAddress, index) {
        const shellLocation = this.dir.get_child(UPOWER_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
          [shellLocation, btMacAddress],
          this._setPercentFromScript(index)
        )
    }

    _toggleBluetoothDevice(btMacAddress, value, callback) {
        const shellLocation = this.dir.get_child(TOGGLE_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
          [shellLocation, btMacAddress, value ? 'connect' : 'disconnect'],
          callback
        )
    }

    disable() {
        GLib.Source.remove(this._loop);
        this._disconnectSignals();
        this._controller.destroy();
        this._controller = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}
