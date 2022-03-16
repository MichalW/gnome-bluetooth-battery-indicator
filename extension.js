const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const MainLoop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const { BluetoothController } = Me.imports.bluetooth;
const { PYTHON_SCRIPT_PATH, BTCTL_SCRIPT_PATH, UPOWER_SCRIPT_PATH, TOGGLE_SCRIPT_PATH } = Me.imports.constants;
const { IndicatorController } = Me.imports.indicator;
const { SettingsController } = Me.imports.settings;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
    }

    enable() {
        this._controller = new BluetoothController();
        this._settings = new SettingsController();
        this._indicator = new IndicatorController();
        Main.panel.addToStatusArea(this._uuid, this._indicator);

        this._controller.enable();
        this._getRefreshButton();

        this._loop = MainLoop.idle_add(this._runLoop.bind(this));

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
            this._enableSignals();
        });
    }

    _enableSignals() {
        this._connectSignal(this._controller, 'device-changed', () => {
            if (!this._settings.getUseToggleBluetooth()) {
                this._refresh();
            }
        });
    }

    _runLoop() {
        this._refresh();

        const interval = this._settings.getInterval();
        this._loop = MainLoop.timeout_add_seconds(interval * 60, this._runLoop.bind(this));
    }

    _getRefreshButton() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
        refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._indicator._addMenuItem(refreshItem);
    }

    _refresh() {
        const settingsDevices = this._settings.getDevices();
        const settingsHideIndicator = this._settings.getHideIndicator();
        const pairedDevices = this._controller.getPairedDevices();
        const devices = this._mergeDevices(settingsDevices, pairedDevices);

        const devicesToShow = devices.filter((device) => (
            device.active && device.isPaired && device.isConnected
        ));

        this._indicator.refresh(devicesToShow);

        devicesToShow.forEach((device, index) => {
            if (this._settings.getUseBluetoothctl()) {
                this._getBatteryLevelBluetoothctl(device.mac, index)
            } else if (this._settings.getUseToggleBluetooth()) {
                this._toggleBluetoothDevice(device.mac, false, () => {
                    this._getBatteryLevel(device.mac, device.port, index);
                    this._toggleBluetoothDevice(device.mac, true);
                });
            } else {
                this._getBatteryLevel(device.mac, device.port, index);
            }
        });

        this._settings.setDevices(devices);

        if (settingsHideIndicator) {
            Main.panel.statusArea[this._uuid].actor.visible = !!devicesToShow.length;
        }
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

    _getBatteryLevel(btMacAddress, port, index) {
        const pyLocation = Me.dir.get_child(PYTHON_SCRIPT_PATH).get_path();
        const pythonExec = Utils.getPythonExec();

        if (!pythonExec) {
            log('ERROR: Python not found.');
            return;
        }

        const address = port ? `${btMacAddress}.${port}` : btMacAddress;

        Utils.runPythonScript(
            [pythonExec, pyLocation, address],
            (result) => {
                const resultArray = result.split(' ');
                const percent = resultArray[resultArray.length - 1];
                this._indicator.setPercentLabel(percent, index);
            }
        )
    }

    _getBatteryLevelBluetoothctl(btMacAddress, index) {
        const shellLocation = Me.dir.get_child(BTCTL_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
          [shellLocation, btMacAddress],
          (result) => {
              const resultArray = result.split(' ');
              const percent = resultArray[resultArray.length - 1];
              this._indicator.setPercentLabel(percent, index);
          }
        )
    }

    _getBatteryLevelUpower(btMacAddress, index) {
        const shellLocation = Me.dir.get_child(UPOWER_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
            [shellLocation, btMacAddress],
            (result) => {
                const resultArray = result.split(' ');
                const percent = resultArray[resultArray.length - 1];
                this._indicator.setPercentLabel(percent, index);
            }
        )
    }

    _toggleBluetoothDevice(btMacAddress, value, callback) {
        const shellLocation = Me.dir.get_child(TOGGLE_SCRIPT_PATH).get_path();

        // Utils.runPythonScript can run any arbitrary script
        Utils.runPythonScript(
          [shellLocation, btMacAddress, value ? 'connect' : 'disconnect'],
          callback
        )
    }

    disable() {
        MainLoop.source_remove(this._loop);
        this._disconnectSignals();
        this._indicator.destroy();
        this._indicator = null;
    }
}

Utils.addSignalsHelperMethods(Extension.prototype);

function init(meta) {
    return new Extension(meta.uuid);
}
