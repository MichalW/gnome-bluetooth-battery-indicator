import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import SettingsWidget from './settingsWidget.js';

export default class BluetoothBatteryIndicatorExtensionPreferences extends ExtensionPreferences {
    getPreferencesWidget() {
        return new SettingsWidget();
    }
}
