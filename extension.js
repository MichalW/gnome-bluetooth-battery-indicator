const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const MainLoop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const { GLib, Gio } = imports.gi;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const { BluetoothController } = Me.imports.bluetooth;
const { GETTEXT_DOMAIN, SCRIPT_PATH } = Me.imports.constants;
const { IndicatorController } = Me.imports.indicator;
const { SettingsController } = Me.imports.settings;
const { isCmdFound } = Me.imports.utils;

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
        MainLoop.timeout_add_seconds(interval * 60, this._runLoop.bind(this));
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

        devices.forEach((device, index) => {
            if (device.active && device.isPaired) {
                if (device.isConnected) {
                    this._getBatteryLevel(device.mac, index);
                } else {
                    this._indicator.setPercentLabel('', index);
                }
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
        const pythonExec = ['python', 'python3', 'python2'].find(cmd => isCmdFound(cmd));

        if (!pythonExec) {
            log('ERROR: Python not found. fallback to default mode');
            return;
        }

        try {
            const [, , , out_fd] = GLib.spawn_async_with_pipes(null, [pythonExec, pyLocation, btMacAddress], null, 0, null);
            const out_reader = new Gio.DataInputStream({
                base_stream: new Gio.UnixInputStream({ fd: out_fd })
            });

            out_reader.read_upto_async('', 0, 0, null, (source_object, res) => {
                const [out, length] = out_reader.read_upto_finish(res);
                if (out && length) {
                    log('bluetooth_battery: ' + out);
                    const outArr = out.split(' ')
                    const percent = outArr[outArr.length - 1];
                    this._indicator.setPercentLabel(percent, index);
                }
            });
        } catch (e) {
            log('ERROR: Python execution failed. fallback to default mode' + e);
        }
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
