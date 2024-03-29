import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class PythonRunner {
    constructor() {
        this._cancellable = null;
    }

    static getPythonExec() {
        return ['python3'].find(cmd => GLib.find_program_in_path(cmd));
    }

    runPythonScript(argv, onSuccess) {
        this.cancel();

        try {
            const proc = new Gio.Subprocess({
                argv,
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });

            this._cancellable = new Gio.Cancellable();
            proc.init(this._cancellable);

            proc.communicate_utf8_async(null, null, (proc, res) => {
                const [, stdout] = proc.communicate_utf8_finish(res);

                if (proc.get_successful() && stdout) {
                    log('[bluetooth-battery-indicator] Percentage from script: ' + stdout);

                    onSuccess(stdout);
                }
            });

            this._cancellable.connect(() => proc.force_exit());
        } catch (e) {
            log('ERROR: Python execution failed: ' + e);
        }
    }

    cancel() {
        if (this._cancellable instanceof Gio.Cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
    }
}
