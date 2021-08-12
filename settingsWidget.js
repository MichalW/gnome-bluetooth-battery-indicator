const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SettingsController } = Me.imports.settings;
const { GETTEXT_DOMAIN } = Me.imports.constants;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const BOX_PADDING = 8;
const MARGIN_BOTTOM = 8;
const WIDGET_PADDING = 16;

const getMarginAll = (value) => (
    shellVersion < 40 ? {
        border_width: value,
    } : {
        margin_start: value,
        margin_top: value,
        margin_end: value,
        margin_bottom: value,
    }
);

const SettingsWidget = GObject.registerClass(
    class MyPrefsWidget extends Gtk.Box {
        _init(params) {
            super._init(params);
            this._settings = new SettingsController();

            this.set_orientation(Gtk.Orientation.VERTICAL);

            if (shellVersion < 40) {
                this.set_border_width(WIDGET_PADDING);
                this.add(this._getIndicatorSettingsFrame());
                this.add(this._getDevicesFrame());
            } else {
                this.append(this._getIndicatorSettingsFrame());
                this.append(this._getDevicesFrame());
            }

            //this.connect('destroy', Gtk.main_quit);
        }

        _getIndicatorSettingsFrame() {
            const hBox1 = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                ...getMarginAll(BOX_PADDING),
            });

            if (shellVersion < 40) {
                hBox1.pack_start(this._getIntervalLabel(), false, false, 0);
                hBox1.pack_end(this._getIntervalSpinButton(), false, false, 0);
            } else {
                hBox1.append(this._getIntervalLabel(), false, false, 0);
                hBox1.append(this._getIntervalSpinButton(), false, false, 0);
            }

            const hBox2 = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
		        ...getMarginAll(BOX_PADDING),
            });

            if (shellVersion < 40) {
                hBox2.pack_start(this._getHideIndicatorLabel(), false, false, 0);
                hBox2.pack_end(this._getHideIndicatorSwitchButton(), false, false, 0);
            } else {
                hBox2.append(this._getHideIndicatorLabel(), false, false, 0);
                hBox2.append(this._getHideIndicatorSwitchButton(), false, false, 0);
            }

            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
		        ...getMarginAll(BOX_PADDING),
            });

            if (shellVersion < 40) {
                vBox.add(hBox1);
                vBox.add(hBox2);
            } else {
                vBox.append(hBox1);
                vBox.append(hBox2);
            }

            const frame = new Gtk.Frame({
                label: _('Indicator Settings'),
                margin_bottom: MARGIN_BOTTOM,
            });

            if (shellVersion < 40) {
                frame.add(vBox);
            } else {
                frame.set_child(vBox);
            }

            return frame;
        }

        _getIntervalLabel() {
            return new Gtk.Label({
                label: _('Refresh interval (minutes)'),
            });
        }

        _getHideIndicatorLabel() {
            return new Gtk.Label({
                label: _('Hide indicator if there are no devices'),
            });
        }

        _getIntervalSpinButton() {
            const spinButton = new Gtk.SpinButton();
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
            const switchButton = new Gtk.Switch({
                active: this._settings.getHideIndicator()
            });

            switchButton.connect('notify::active', ({ active }) => {
                this._settings.setHideIndicator(active);
            });

            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
            });

            if (shellVersion < 40) {
                vBox.pack_start(switchButton, true, false, 0);
            } else {
                vBox.append(switchButton, true, false, 0);
            }
            return vBox;
        }

        _getDevicesFrame() {
            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
		        ...getMarginAll(BOX_PADDING),
            });

            const devices = this._settings.getPairedDevices();
            devices.forEach((device) => {
                if (shellVersion < 40) {
                    vBox.add(this._getDeviceBox(device));
                } else {
                    vBox.append(this._getDeviceBox(device));
                }
            });

            const frame = new Gtk.Frame({
                label: _('Devices'),
                margin_bottom: MARGIN_BOTTOM,
            });

            if (shellVersion < 40) {
                frame.add(vBox);
            } else {
                frame.set_child(vBox);
            }
            return frame;
        }

        _getDeviceBox(device) {
            const hBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
		        ...getMarginAll(BOX_PADDING),
            });

            if (shellVersion < 40) {
                hBox.pack_start(this._getDeviceLabel(device), false, false, 0);
                hBox.pack_end(this._getDeviceSwitchButton(device), false, false, 0);
                hBox.pack_end(this._getDeviceIconComboBox(device), false, false, 16);
            } else {
                hBox.append(this._getDeviceLabel(device), false, false, 0);
                hBox.append(this._getDeviceSwitchButton(device), false, false, 0);
                hBox.append(this._getDeviceIconComboBox(device), false, false, 16);
            }

            return hBox;
        }

        _getDeviceLabel(device) {
            return new Gtk.Label({
                label: device.name,
            });
        }

        _getDeviceIconComboBox(device) {
            const comboBox = new Gtk.ComboBoxText();

            const icons = [
                { key: 'battery-full-symbolic', text: 'Default' },
                { key: 'audio-headphones-symbolic', text: 'Headphones' },
                { key: 'input-mouse-symbolic', text: 'Mouse' },
                { key: 'input-keyboard-symbolic', text: 'Keyboard'},
                { key: 'audio-headset-symbolic', text: 'Headset'},
            ];

            icons.forEach((icon) => {
                comboBox.append_text(icon.text);
            })
            const activeIndex = icons.findIndex(({ key }) => device.icon === key);
            comboBox.set_active(activeIndex !== -1 ? activeIndex : 0);

            comboBox.connect('changed', () => {
                const i = comboBox.get_active();
                this._settings.setDevice({
                    mac: device.mac,
                    icon: icons[i].key,
                });
            });

            return comboBox;
        }

        _getDeviceSwitchButton(device) {
            const switchButton = new Gtk.Switch({
                active: device.active || false,
            });

            switchButton.connect('notify::active', ({ active }) => {
                this._settings.setDevice({
                    mac: device.mac,
                    active,
                });
            });

            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
            });

            if (shellVersion < 40) {
                vBox.pack_start(switchButton, true, false, 0);
            } else {
                vBox.append(switchButton, true, false, 0);
            }
            return vBox;
        }
    }
);
