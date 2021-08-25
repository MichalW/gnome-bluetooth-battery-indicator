const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const INTERVAL_KEY = 'interval';
const HIDE_INDICATOR_KEY = 'hide-indicator';
const DEVICES_KEY = 'devices';

var SettingsController = class SettingsController {
    constructor() {
        this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);
    }

    getInterval() {
        return this._settings.get_int(INTERVAL_KEY);
    }

    setInterval(interval) {
        this._settings.set_int(INTERVAL_KEY, interval);
    }

    getHideIndicator() {
        return this._settings.get_boolean(HIDE_INDICATOR_KEY);
    }

    setHideIndicator(value) {
        this._settings.set_boolean(HIDE_INDICATOR_KEY, value);
    }

    getDevices() {
        return this._settings.get_strv(DEVICES_KEY).map(JSON.parse);
    }

    getPairedDevices() {
        return this.getDevices().filter(({ isPaired }) => isPaired);
    }

    setDevices(devices) {
        this._settings.set_strv(DEVICES_KEY, devices.map(JSON.stringify));
    }

    setDevice(device) {
        const devices = this.getDevices();
        const indexOf = devices.findIndex(({ mac }) => device.mac === mac);

        if (indexOf !== -1) {
            devices[indexOf] = {
                ...devices[indexOf],
                ...device,
            };
            this.setDevices(devices);
        }
    }
}
