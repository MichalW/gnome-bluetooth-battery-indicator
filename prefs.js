const { GObject, Gtk } = imports.gi;
const gtkVersion = Gtk.get_major_version();

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SettingsController } = Me.imports.settings;
const { GETTEXT_DOMAIN } = Me.imports.constants;

const PrefsWidget = GObject.registerClass({
    GTypeName: 'PrefsWidget',
    Template: Me.dir.get_child('prefs.gtk'+gtkVersion+'.ui').get_uri(),
}, class PrefsWidget extends Gtk.Box {
    _init(params = {}) {
        super._init(params);
        this._settings = new SettingsController();

        this.icons = [
            { key: 'battery-full-symbolic', text: 'Default' },
            { key: 'audio-headphones-symbolic', text: 'Headphones' },
            { key: 'input-mouse-symbolic', text: 'Mouse' },
            { key: 'input-keyboard-symbolic', text: 'Keyboard'},
            { key: 'audio-headset-symbolic', text: 'Headset'},
        ];
    }

    _append(w, f) {
        const c = f();
        if (gtkVersion == 4) w.append(c);
        else w.pack_start(c, false, false, 0);
    }

    _initInterval(w) {
        w.set_sensitive(true);
        w.set_range(1, 60);
        w.set_value(this._settings.getInterval() || 2);
        w.set_increments(1, 2);
    }

    _setInterval(w) {
        this._settings.setInterval(w.get_value_as_int());
    }

    _initHideIndicator(w) {
        w.active = this._settings.getHideIndicator();
    }

    _setHideIndicator(w) {
        this._settings.setHideIndicator(w.get_active());
    }

    _initDevices(w) {
        this._settings.getPairedDevices().forEach((device) => {
            this._append(w, () => {
                const box_device = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 8,
                });

                this._append(box_device, () => {
                    return new Gtk.Label({
                        label: device.name,
                        tooltip_text: device.mac,
                    });
                });

                this._append(box_device, () => {
                    const switch_deviceActive = new Gtk.Switch({
                        valign: Gtk.Align.CENTER,
                        active: device.active || false,
                    });

                    switch_deviceActive.connect('state-set', this._setDeviceActive.bind(this));

                    return switch_deviceActive;
                });

                this._append(box_device, () => {
                    const comboBoxText_deviceIcon = new Gtk.ComboBoxText();

                    this.icons.forEach((icon) => comboBoxText_deviceIcon.append_text(icon.text));
                    const activeIndex = this.icons.findIndex(({ key }) => device.icon === key);
                    comboBoxText_deviceIcon.set_active(activeIndex !== -1 ? activeIndex : 0);

                    comboBoxText_deviceIcon.connect('changed', this._setDeviceIcon.bind(this));

                    return comboBoxText_deviceIcon;
                });

                return box_device;
            });
        });
    }

    _setDeviceActive(w) {
        this._settings.setDevice({
            mac: w.parent.get_first_child().get_tooltip_text(),
            active: w.get_active(),
        });
    }

    _setDeviceIcon(w) {
        this._settings.setDevice({
            mac: w.parent.get_first_child().get_tooltip_text(),
            icon: this.icons[w.get_active()].key,
        });
    }
});

function init() {
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
}

function buildPrefsWidget() {
    return new PrefsWidget();
}
