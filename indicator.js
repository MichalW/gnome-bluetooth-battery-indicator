const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const { GObject, St, Clutter } = imports.gi;

const UUID = "bluetooth-battery@michalw.github.com";

var IndicatorController = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(devices) {
            super._init(0.0, _('Bluetooth battery Indicator'));
            this._container = new St.BoxLayout();
            this._labels = [];
            this._icons = [];

            this._addSettingsButton();
            this._addBoxes(devices);
        }

        refresh(devices) {
            this._container.remove_all_children();
            this._addBoxes(devices);
        }

        _addMenuItem(item) {
            this.menu.addMenuItem(item);
        }

        _addSettingsButton() {
            const settings = new PopupMenu.PopupMenuItem(_('Settings'));
            settings.connect('activate', () => {
                Util.spawn(['gnome-extensions', 'prefs', UUID]);
            });
            this._addMenuItem(settings);
        }

        _addBoxes(devices) {
            devices.forEach((device, index) => {
                const box = this._getBox(device, index);

                this._container.add_child(box);
            });

            if (!devices.length) {
                this._container.add_child(this._getBoxIcon({}));
            }

            this.add_child(this._container);
        }

        _getBox(device, index) {
            const box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

            this._icons[index] = this._getBoxIcon(device);
            this._labels[index] = this._getBoxLabel();

            box.add_child(this._icons[index]);
            box.add_child(this._labels[index]);

            return box;
        }

        _getBoxLabel() {
            return new St.Label({
                y_align: Clutter.ActorAlign.CENTER
            });
        }

        _getBoxIcon(device) {
            return new St.Icon({
                icon_name: device.icon || 'battery-full-symbolic',
                style_class: 'system-status-icon',
            });
        }

        setPercentLabel(percent, index) {
            if (this._labels[index]) {
                this._labels[index].text = (percent || '').trim();
            }
        }
    }
);
