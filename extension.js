const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const MainLoop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const { BluetoothController } = Me.imports.bluetooth;
const { GETTEXT_DOMAIN, SCRIPT_PATH } = Me.imports.constants;
const { IndicatorController } = Me.imports.indicator;
const { SettingsController } = Me.imports.settings;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
        this._controller = new BluetoothController();
        this._settings = new SettingsController();
        this._settingsTS = 0;
    }

    enable() {
        const devices = this._settings.getActiveDevices();
        this._indicator = new IndicatorController(devices);
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
            this._refresh();
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
        const settingsTs = this._settings.getSettingsTS();
        const activeDevices = this._settings.getActiveDevices();
        const settingsDevices = this._settings.getDevices();
        const pairedDevices = this._controller.getPairedDevices();
        const devices = this._mergeDevices(settingsDevices, pairedDevices);

        if (this._settingsTS !== settingsTs) {
            this._indicator.refresh(activeDevices);
            this._settingsTS = settingsTs;
        }

        devices
            .filter((device) => device.active && device.isPaired)
            .forEach((device, index) => {
                if (device.isConnected) {
                    this._getBatteryLevel(device.mac, index);
                } else {
                    this._indicator.setPercentLabel('', index);
                }
            });

        this._settings.setDevices(devices);
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

    _getBatteryLevel(btMacAddress, index) {
        const pyLocation = Me.dir.get_child(SCRIPT_PATH).get_path();
        const pythonExec = Utils.getPythonExec();

        if (!pythonExec) {
            log('ERROR: Python not found.');
            return;
        }

        Utils.runPythonScript(
            [pythonExec, pyLocation, btMacAddress],
            (result) => {
                const resultArray = result.split(' ');
                const percent = resultArray[resultArray.length - 1];
                this._indicator.setPercentLabel(percent, index);
            }
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
