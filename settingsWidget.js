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

const getMarginAll = (value) => ({
    margin_start: value,
    margin_top: value,
    margin_end: value,
    margin_bottom: value,
});

const addToBox = (box, element) => {
    if (shellVersion < 40) {
        box.add(element);
    } else {
        box.append(element);
    }
}

const SettingsWidget = GObject.registerClass(
    class MyPrefsWidget extends Gtk.Box {
        _init(params) {
            super._init(params);
            this._settings = new SettingsController();

            this.set_orientation(Gtk.Orientation.VERTICAL);

            if (shellVersion < 40) {
                this.set_border_width(WIDGET_PADDING);
            }

            addToBox(this, this._getIndicatorSettingsFrame());
            addToBox(this, this._getDevicesFrame());

            //this.connect('destroy', Gtk.main_quit);
        }

        _getIndicatorSettingsFrame() {
            const hBox1 = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(hBox1, this._getIntervalLabel());
            addToBox(hBox1, this._getIntervalSpinButton());

            const hBox2 = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(hBox2, this._getHideIndicatorLabel());
            addToBox(hBox2, this._getHideIndicatorSwitchButton());

            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(vBox, hBox1);
            addToBox(vBox, hBox2);

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
                xalign: 0,
                hexpand: true,
            });
        }

        _getHideIndicatorLabel() {
            return new Gtk.Label({
                label: _('Hide indicator if there are no devices'),
                xalign: 0,
                hexpand: true,
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

            addToBox(vBox, switchButton);

            return vBox;
        }

        _getDevicesHeaders() {
            const hBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(hBox, this._getLabel('Name'));
            addToBox(hBox, this._getLabel('Enabled', false, 60));
            addToBox(hBox, this._getLabel('Icon', false, 70));
            addToBox(hBox, this._getLabel('Port', false, 40));

            return hBox;
        }

        _getDevicesFrame() {
            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                ...getMarginAll(BOX_PADDING),
            });

            const headers = this._getDevicesHeaders();
            addToBox(vBox, headers);

            const devices = this._settings.getPairedDevices();
            devices.forEach((device) => {
                addToBox(vBox, this._getDeviceBox(device));
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

            addToBox(hBox, this._getLabel(device.name));
            addToBox(hBox, this._getDeviceSwitchButton(device));
            addToBox(hBox, this._getDeviceIconComboBox(device));
            addToBox(hBox, this._getPortComboBox(device));

            return hBox;
        }

        _getLabel(labelName, hexpand = true, marginEnd = 0) {
            const box = new Gtk.Box({
                margin_end: marginEnd,
            })

            const label = new Gtk.Label({
                label: labelName,
                xalign: 0,
                hexpand,
            });

            addToBox(box, label);

            return box;
        }

        _getDeviceIconComboBox(device) {
            const comboBox = new Gtk.ComboBoxText();

            const icons = [
                { key: 'battery-full-symbolic', text: 'Default' },
                { key: 'audio-headphones-symbolic', text: 'Headphones' },
                { key: 'input-mouse-symbolic', text: 'Mouse' },
                { key: 'input-keyboard-symbolic', text: 'Keyboard' },
                { key: 'audio-headset-symbolic', text: 'Headset' },
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

        _getPortComboBox(device) {
            const box = new Gtk.Box({
                margin_start: BOX_PADDING,
            })

            const comboBox = new Gtk.ComboBoxText();

            [...Array(10).keys()].forEach((port) => {
                comboBox.append_text(port ? String(port) : 'Default');
            })
            comboBox.set_active(device.port || 0);

            comboBox.connect('changed', () => {
                const i = comboBox.get_active();
                this._settings.setDevice({
                    mac: device.mac,
                    port: i,
                });
            });

            addToBox(box, comboBox);

            return box;
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
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(vBox, switchButton);

            return vBox;
        }
    }
);
