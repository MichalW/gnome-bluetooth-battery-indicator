import Adw from 'gi://Adw';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import SettingsWidget from './settingsWidget.js';
import {SettingsController} from './settings.js';

export default class BluetoothBatteryIndicatorExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settingsController = new SettingsController(this.getSettings());

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        const settingsWidget = new SettingsWidget(settingsController);
        group.add(settingsWidget);

        window.add(page);
    }
}
