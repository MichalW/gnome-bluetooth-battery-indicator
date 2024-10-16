import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const BOX_PADDING = 8;
const MARGIN_BOTTOM = 8;

const getMarginAll = (value) => ({
    margin_start: value,
    margin_top: value,
    margin_end: value,
    margin_bottom: value,
});

const addToBox = (box, element) => {
    box.append(element);
}

export default GObject.registerClass(
    class SettingsWidget extends Gtk.Box {
        _init(settings) {
            super._init();

            this._settings = settings;
            this.set_orientation(Gtk.Orientation.VERTICAL);

            addToBox(this, this._getIndicatorSettingsFrame());
            this._getDevicesFrame().then((element) => {
                addToBox(this, element);
            });
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

            frame.set_child(vBox);

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
            return this._getSwitchButton(
              () => this._settings.getHideIndicator(),
              (value) => this._settings.setHideIndicator(value)
            );
        }

        _getSwitchButton(getValue, setValue) {
            const switchButton = new Gtk.Switch({
                active: getValue()
            });

            switchButton.connect('notify::active', ({ active }) => {
                setValue(active)
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

            addToBox(hBox, this._getLabel(_('Name')));
            addToBox(hBox, this._getLabel(_('Status'), false, 60));
            addToBox(hBox, this._getLabel(_('Icon'), false, 80));

            return hBox;
        }

        async _getDevicesFrame() {
            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                ...getMarginAll(BOX_PADDING),
            });

            const headers = this._getDevicesHeaders();
            addToBox(vBox, headers);

            const devices = await this._settings.getDevices();
            devices.forEach((device) => {
                addToBox(vBox, this._getDeviceBox(device));
            });

            const frame = new Gtk.Frame({
                label: _('Devices'),
                margin_bottom: MARGIN_BOTTOM,
            });

            frame.set_child(vBox);

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
            const defaultIcon = device.defaultIcon || 'battery-full-symbolic';

            const icons = [
                { key: defaultIcon, text: _('Default') },
                { key: 'audio-headphones-symbolic', text: _('Headphones') },
                { key: 'input-mouse-symbolic', text: _('Mouse') },
                { key: 'input-keyboard-symbolic', text: _('Keyboard') },
                { key: 'audio-headset-symbolic', text: _('Headset') },
                { key: 'input-gaming-symbolic', text: _('Game Controller') },
                { key: 'audio-speakers-symbolic', text: _('Speaker') },
                { key: 'battery-full-symbolic', text: _('Battery') },
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
                active: device.isActive || false,
            });

            switchButton.connect('notify::active', ({ active }) => {
                this._settings.setDevice({
                    mac: device.mac,
                    isActive: active
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
