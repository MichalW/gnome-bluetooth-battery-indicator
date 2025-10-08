const INTERVAL_KEY = 'interval';
const HIDE_INDICATOR_KEY = 'hide-indicator';
const SHOW_NOTIFICATION_KEY = 'show-notification';
const BATTERY_FILL_EFFECT = 'battery-fill-effect';
const DEVICES_KEY = 'devices';

export class SettingsController {
    constructor(settings) {
        this._settings = settings;
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

    getShowNotification() {
        return this._settings.get_boolean(SHOW_NOTIFICATION_KEY);
    }

    setShowNotification(value) {
        this._settings.set_boolean(SHOW_NOTIFICATION_KEY, value);
    }

    getBatteryFillEffect() {
        return this._settings.get_boolean(BATTERY_FILL_EFFECT);
    }

    setBatteryFillEffect(value) {
        this._settings.set_boolean(BATTERY_FILL_EFFECT, value);
    }


    getDevices() {
        return this._settings.get_strv(DEVICES_KEY).map(JSON.parse);
    }

    setDevices(devices) {
        this._settings.set_strv(DEVICES_KEY, devices.map((device) => JSON.stringify({
            name: device.name,
            mac: device.mac,
            icon: device.icon,
            isActive: device.isActive,
        })));
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
