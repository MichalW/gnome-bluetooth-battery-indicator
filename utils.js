const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

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

function getPythonExec() {
	//return ['python', 'python3', 'python2'].find(cmd => GLib.find_program_in_path(cmd));
	return ['python3'].find(cmd => GLib.find_program_in_path(cmd)); //Hotfix for no percentage shown
}

function runPythonScript(argv, onSuccess) {
    try {
        const proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);

        proc.communicate_utf8_async(null, null, (proc, res) => {
            const [, stdout] = proc.communicate_utf8_finish(res);

            if (proc.get_successful() && stdout) {
                log('[bluetooth-battery-indicator] Percentage from script: ' + stdout);

                onSuccess(stdout);
            }
        });
    } catch (e) {
        log('ERROR: Python execution failed: ' + e);
    }
}
