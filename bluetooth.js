const GnomeBluetooth = imports.gi.GnomeBluetooth;
const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

var BluetoothController = class {
    constructor() {
        this._client = new GnomeBluetooth.Client();
        this._model = this._client.get_model();
    }

    enable() {
        this._connectSignal(this._model, 'row-changed', () => {
            this.emit('device-changed');
        });
        this._connectSignal(this._model, 'row-deleted', () => {
            this.emit('device-changed');
        });
        this._connectSignal(this._model, 'row-inserted', () => {
            this.emit('device-changed');
        });
    }

    getDevices() {
        const devices = [];
        const adapter = this._getDefaultAdapter();

        if (!adapter) {
            return [];
        }

        let [ret, iter] = this._model.iter_children(adapter);
        while (ret) {
            let device = this._buildDevice(iter);
            devices.push(device);
            ret = this._model.iter_next(iter);
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

    _getDefaultAdapter() {
        let [ret, iter] = this._model.get_iter_first();
        while (ret) {
            let isDefault = this._model.get_value(iter, GnomeBluetooth.Column.DEFAULT);
            let isPowered = this._model.get_value(iter, GnomeBluetooth.Column.POWERED);
            if (isDefault && isPowered)
                return iter;
            ret = this._model.iter_next(iter);
        }
        return null;
    }

    _buildDevice(iter) {
        return new BluetoothDevice(this._model, iter);
    }
}

Signals.addSignalMethods(BluetoothController.prototype);
Utils.addSignalsHelperMethods(BluetoothController.prototype);

var BluetoothDevice = class {
    constructor(model, iter) {
        this._model = model;
        this.update(iter);
    }

    update(iter) {
        this.name = this._model.get_value(iter, GnomeBluetooth.Column.NAME);
        this.isConnected = this._model.get_value(iter, GnomeBluetooth.Column.CONNECTED);
        this.isPaired = this._model.get_value(iter, GnomeBluetooth.Column.PAIRED);
        this.mac = this._model.get_value(iter, GnomeBluetooth.Column.ADDRESS);
        this.isDefault = this._model.get_value(iter, GnomeBluetooth.Column.DEFAULT);
        this.defaultIcon = this._model.get_value(iter, GnomeBluetooth.Column.ICON);
    }
}
