const GnomeBluetooth = imports.gi.GnomeBluetooth;
const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

var BluetoothController = class {
    constructor() {
        this._client = new GnomeBluetooth.Client();
        this._deviceNotifyConnected = new Set();
    }

    enable() {
        
        this._connectSignal(this._client, 'device-added', (c,device) => {
            this.emit('device-changed');
            this._connectDeviceNotify(device);
        });
        this._connectSignal(this._client, 'device-removed', () => {
            this.emit('device-changed');
        });
        this._connectSignal(this._client, 'notify', () => {
            this.emit('device-changed');
        });
    }

    _connectDeviceNotify(device) {
        const path = device.get_object_path();

        if (this._deviceNotifyConnected.has(path))
            return;

        device.connect('notify', (device) => {
            this.emit('device-changed');
        });
    }

    getDevices() {
        const devices = [];
        let items = this._client.get_devices()
        for (let i = 0; i < items.get_n_items(); i++) {
            const device = items.get_item(i);
            devices.push(this._buildDevice(device))
            
        }
        return devices;
    }

    getConnectedDevices() {
        return this.getDevices().filter(({ isConnected }) => isConnected);
    }

    getPairedDevices() {
        return this.getDevices().filter(({ isPaired }) => isPaired);
    }

    destroy() {
        this._disconnectSignals();
    }
    _buildDevice(gdev) {
        return new BluetoothDevice(gdev);
    }
}

Signals.addSignalMethods(BluetoothController.prototype);
Utils.addSignalsHelperMethods(BluetoothController.prototype);

var BluetoothDevice = class {
    constructor(gdevice, iter) {
        this.update(gdevice);
    }

    update(gdev) {
        this.name = gdev.name;
        this.isConnected = gdev.connected;
        this.isPaired = gdev.paired;
        this.mac = gdev.address;
        this.defaultIcon = gdev.icon;
    }
}
