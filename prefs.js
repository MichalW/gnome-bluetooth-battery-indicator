'use strict';

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Config = imports.misc.config;

// It's common practice to keep GNOME API and JS imports in separate blocks
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SettingsWidget } = Me.imports.settingsWidget;

function init() {
    log(`initializing ${Me.metadata.name} Preferences`);

    ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
    const prefsWidget = new SettingsWidget();
    prefsWidget.show();

    // At the time buildPrefsWidget() is called, the window is not yet prepared
    // so if you want to access the headerbar you need to use a small trick
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        const window = prefsWidget.get_root();
    });

    return prefsWidget;
}
