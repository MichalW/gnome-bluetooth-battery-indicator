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

function fillPreferencesWindow(window) {
    window.add(new SettingsWidget());
}
