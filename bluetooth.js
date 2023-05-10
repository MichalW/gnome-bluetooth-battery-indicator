const GnomeBluetooth = imports.gi.GnomeBluetooth;
const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

var BluetoothController = class {
    constructor() {
        this._client = new GnomeBluetooth.Client();
        this._model = this._client.get_devices();
    }

    enable() {
        this._connectSignal(this._client, 'device-added', () => this.emit('device-changed'));
        this._connectSignal(this._client, 'device-removed', () => this.emit('device-changed'));
        this._connectSignal(this._model, 'items-changed', () => this.emit('device-changed'));
    }

    getDevices() {
        const devices = [];
       
        const count = this._model.get_n_items()
        for(let i = 0; i < count; ++i){
            const device = this._model.get_item(i)
            if(device == null) continue
            devices.push({
                name:        device.name,
                alias:       device.alias,
                isConnected: device.connected,
                isPaired:    device.paired,
                mac:         device.address,
                isDefault:   false, // couldn't find in docs its equivalent
                defaultIcon: device.icon,
            })

            // while GnomeBluetooth.Device now exists, this is done
            // to retain the backwards-compatibility with previous
            // configurations (or an attempt to do so)
        }

        return devices;
    }

    getConnectedDevices() {
        return this.getDevices().filter((device) => device.isConnected);
    }

    getPairedDevices() {
        return this.getDevices().filter((device) => device.isPaired);
    }

    destroy() {
        this._disconnectSignals();
    }
}

Signals.addSignalMethods(BluetoothController.prototype);
Utils.addSignalsHelperMethods(BluetoothController.prototype);