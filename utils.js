// This script is from https://github.com/bjarosze/gnome-bluetooth-quick-connect

const GLib = imports.gi.GLib;

function spawn(command, callback) {
    let [status, pid] = GLib.spawn_async(
        null,
        ['/usr/bin/env', 'bash', '-c', command],
        null,
        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
        null
    );

    if (callback)
        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, callback);
}


function isDebugModeEnabled() {
    return new Settings().isDebugModeEnabled();
}

class Logger {
    constructor(settings) {
        this._enabled = settings.isDebugModeEnabled();
    }

    info(message) {
        if (!this._enabled) return;

        global.log(`[bluetooth-quick-connect] ${message}`);
    }
}

function addSignalsHelperMethods(prototype) {
    prototype._connectSignal = function (subject, signal_name, method) {
        if (!this._signals) this._signals = [];

        let signal_id = subject.connect(signal_name, method);
        this._signals.push({
            subject: subject,
            signal_id: signal_id
        });
    }

    prototype._disconnectSignals = function () {
        if (!this._signals) return;

        this._signals.forEach((signal) => {
            signal.subject.disconnect(signal.signal_id);
        });
        this._signals = [];
    };
}

function isCmdFound(cmd) {
    try {
        let [result, out, err, exit_code] = GLib.spawn_command_line_sync(cmd);
        return true;
    }
    catch (e) {
        return false;
    }
}
