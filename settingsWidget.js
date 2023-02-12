const Adw = imports.gi.Adw;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SettingsController } = Me.imports.settings;

const _ = ExtensionUtils.gettext;

var SettingsWidget = GObject.registerClass(
    class MyPrefsWidget extends Adw.PreferencesPage {
        _init(params) {
            super._init(params);
            this._settings = new SettingsController();

            this.add(this._getIndicatorSettingsGroup());
            this.add(this._getDevicesGroup());
        }

        _getIndicatorSettingsGroup() {
            const group = new Adw.PreferencesGroup({
                title: _('Indicator Settings'),
            });

            const row1 = new Adw.ActionRow({
                title: _('Refresh interval (minutes)')
            });

            row1.add_suffix(this._getIntervalSpinButton());

            const row2 = new Adw.ActionRow({
                title: _('Hide indicator if there are no devices')
            });

            row2.add_suffix(this._getHideIndicatorSwitchButton());

            group.add(row1);
            group.add(row2);

            return group;
        }

        _getIntervalSpinButton() {
            const spinButton = new Gtk.SpinButton({
                valign: 3
            });
            const interval = this._settings.getInterval();

            spinButton.set_sensitive(true);
            spinButton.set_range(1, 60);
            spinButton.set_value(interval || 2);
            spinButton.set_increments(1, 2);

            spinButton.connect('value-changed', (w) => {
                this._settings.setInterval(w.get_value_as_int());
            });

            return spinButton;
        }

        _getHideIndicatorSwitchButton() {
            return this._getSwitchButton(
              () => this._settings.getHideIndicator(),
              (value) => this._settings.setHideIndicator(value)
            );
        }

        _getSwitchButton(getValue, setValue) {
            const switchButton = new Gtk.Switch({
                active: getValue(),
                valign: 3
            });

            switchButton.connect('notify::active', ({ active }) => {
                setValue(active)
            });

            return switchButton;
        }

        _getDevicesGroup() {
            const group = new Adw.PreferencesGroup({
                title: _('Devices'),
            });

            const devices = this._settings.getPairedDevices();
            devices.forEach((device) => {
                const dev = new Adw.ExpanderRow({
                    title: device.name
                });
                dev.add_action(this._getDeviceSwitchButton(device));
                dev.add_row(this._getDeviceIconComboRow(device));
                dev.add_row(this._getPortComboRow(device));
                dev.add_row(this._getPercentageSourceComboRow(device));

                group.add(dev);
            });

            return group;
        }

        _getDeviceIconComboRow(device) {
            const comboRow = new Adw.ComboRow({
                title: _('Icon')
            });
            const defaultIcon = device.defaultIcon || 'battery-full-symbolic';

            const icons = [
                { key: defaultIcon, text: _('Default') },
                { key: 'audio-headphones-symbolic', text: _('Headphones') },
                { key: 'input-mouse-symbolic', text: _('Mouse') },
                { key: 'input-keyboard-symbolic', text: _('Keyboard') },
                { key: 'audio-headset-symbolic', text: _('Headset') },
                { key: 'input-gaming-symbolic', text: _('Game Controller') },
                { key: 'battery-full-symbolic', text: _('Battery') },
            ];

            const model = new Gtk.StringList();

            icons.forEach((icon) => {
                model.append(icon.text);
            })
            comboRow.set_model(model);

            const activeIndex = icons.findIndex(({ key }) => device.icon === key);
            comboRow.set_selected(activeIndex !== -1 ? activeIndex : 0);

            comboRow.connect('notify::selected', () => {
                const i = comboRow.get_selected();
                this._settings.setDevice({
                    mac: device.mac,
                    icon: icons[i].key,
                });
            });

            return comboRow;
        }

        _getPortComboRow(device) {
            const comboRow = new Adw.ComboRow({
                title: _('Port')
            });

            const model = new Gtk.StringList();

            [...Array(10).keys()].forEach((port) => {
                model.append(port ? String(port) : _('Default'));
            })
            comboRow.set_model(model);
            comboRow.set_selected(device.port || 0);

            comboRow.connect('notify::selected', () => {
                const i = comboRow.get_selected();
                this._settings.setDevice({
                    mac: device.mac,
                    port: i,
                });
            });

            return comboRow;
        }

        _getDeviceSwitchButton(device) {
            const switchButton = new Gtk.Switch({
                active: device.active || false,
                valign: 3
            });

            switchButton.connect('notify::active', ({ active }) => {
                this._settings.setDevice({
                    mac: device.mac,
                    active,
                });
            });

            return switchButton;
        }

        _getPercentageSourceComboRow(device) {
            const comboRow = new Adw.ComboRow({
                title: _('% Source')
            });

            const sources = [
                { key: 'python-script', text: _('Python script') },
                { key: 'bluetoothctl', text: _('Bluetoothctl') },
                { key: 'upower', text: _('UPower') }
            ];

            const model = new Gtk.StringList();

            sources.forEach((src) => {
                model.append(src.text);
            })
            comboRow.set_model(model);

            const activeIndex = sources.findIndex(({ key }) => device.percentageSource === key);
            comboRow.set_selected(activeIndex !== -1 ? activeIndex : 0);

            comboRow.connect('notify::selected', () => {
                const i = comboRow.get_selected();
                this._settings.setDevice({
                    mac: device.mac,
                    percentageSource: sources[i].key,
                });
            });

            return comboRow;
        }
    }
);
