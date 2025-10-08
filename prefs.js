import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import SettingsWidget from './settingsWidget.js';
import {SettingsController} from './settings.js';

export default class HyperxBatteryIndicatorExtensionPreferences extends ExtensionPreferences {
    getPreferencesWidget() {
        const settingsController = new SettingsController(this.getSettings());

        return new SettingsWidget(settingsController);
    }
}
