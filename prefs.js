'use strict';

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Config = imports.misc.config;

// It's common practice to keep GNOME API and JS imports in separate blocks
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SettingsWidget } = Me.imports.settingsWidget;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

function init() {
    log(`initializing ${Me.metadata.name} Preferences`);
}

function buildPrefsWidget() {
    const prefsWidget = new SettingsWidget();
    if (shellVersion < 40) {
        prefsWidget.show_all();
    } else {
        prefsWidget.show();
    }

    // At the time buildPrefsWidget() is called, the window is not yet prepared
    // so if you want to access the headerbar you need to use a small trick
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        const window = prefsWidget.get_toplevel();
        const headerBar = window.get_titlebar();
        headerBar.title = `${Me.metadata.name} Preferences`;
    });

    return prefsWidget;
}
