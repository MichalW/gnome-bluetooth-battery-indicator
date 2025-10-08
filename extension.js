import GLib from 'gi://GLib';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { UPowerController } from './UPowerController.js';
import { IndicatorController } from './indicator.js';
import { SettingsController } from './settings.js';

import * as Constants from './constants.js';

let source;


export default class HyperxBatteryIndicatorExtension extends Extension {
    enable() {
        this._controller = new UPowerController(this.dir);
        this._settings = new SettingsController(this.getSettings());
        this._indicator = new IndicatorController();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._getRefreshButton();

        this._idle = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, this._runLoop.bind(this));
    }

    _runLoop() {
        this._refresh();

        if (this._loop) {
            GLib.Source.remove(this._loop);
        }
        const interval = this._settings.getInterval();
        this._loop = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval * 60, this._runLoop.bind(this));
    }

    _getRefreshButton() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
        refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._indicator._addMenuItem(refreshItem);
    }

    async _refresh() {
        const settingsDevices = this._settings.getDevices();
        const settingsHideIndicator = this._settings.getHideIndicator();
        const uPowerDevices = await this._controller.getDevices();
        const devices = this._mergeDevices(settingsDevices, uPowerDevices);
        const settingsBatteryFillEffect = this._settings.getBatteryFillEffect();

        const devicesToShow = devices.filter((device) => device.isConnected && device.isActive).map((device) => ({ ...device, fillEffect: settingsBatteryFillEffect }))
        this._indicator.refresh(devicesToShow);

        this._settings.setDevices(devices);
        if (settingsHideIndicator) {
            Main.panel.statusArea[this.uuid].visible = !!devices.length;
        }


        const settingsShowNotification = this._settings.getShowNotification();
        const devicesToShowNoficiation = devices.filter((device) => device.percentage <= Constants.BATTERY_WARNING_PERCENTAGE);
        if (settingsShowNotification && devicesToShowNoficiation && devicesToShowNoficiation.length > 0) {
            for (let i = 0; i < devicesToShowNoficiation.length; i++) {
                const title = devicesToShowNoficiation[i].name + ' - ' + devicesToShowNoficiation[i].batteryPercentage;
                this._showNotification(title);
            }
        }
    }

    _showNotification(title) {
        try {
            source = new MessageTray.Source({
                title: _('Hyperx battery Indicator'),
                iconName: 'dialog-information',
            });
            Main.messageTray.add(source);

            const n = new MessageTray.Notification({
                source,
                title: title + ' ' + _('Low Battery'),
                body: _('You might want to Maybe charge your headset.'),
                urgency: MessageTray.Urgency.NORMAL,
            });

            source.addNotification(n);
        } catch (e) {
            console.log(e, 'Failed to show notification');
        }
    }

    _mergeDevices(settingsDevices, uPowerDevices) {
        const filterByMac = (mac) => (device) => device.mac === mac;
        const newDevices = uPowerDevices.filter((device) => !settingsDevices.some(filterByMac(device.mac)));

        return [
            ...newDevices,
            ...settingsDevices.map((device) => ({
                ...device,
                ...uPowerDevices.find(filterByMac(device.mac)),
            })),
        ];
    }

    disable() {
        if (this._idle !== null) {
            GLib.Source.remove(this._idle);
            this._idle = null;
        }

        if (this._loop !== null) {
            GLib.Source.remove(this._loop);
            this._loop = null;
        }

        if (this._controller !== null) {
            this._controller.destroy();
            this._controller = null;
        }
        if (this._indicator !== null) {
            this._indicator.destroy();
            this._indicator = null;
        }

        if (this._settings !== null) {
            this._settings = null;
        }
        if (this.source) {
            this.source.destroy();
            this.source = null;
        }
    }
}
