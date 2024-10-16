import Gio from 'gi://Gio';

export class ScriptRunner {
    constructor() {
        this._cancellable = null;
    }

    async runScriptAsync(argv) {
        return new Promise((resolve, reject) => {
            this.cancel();

            try {
                const proc = new Gio.Subprocess({
                    argv,
                    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                });

                this._cancellable = new Gio.Cancellable();
                proc.init(this._cancellable);

                proc.communicate_utf8_async(null, null, (proc, res) => {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);

                    if (proc.get_successful() && stdout) {
                        resolve(stdout);
                    } else {
                        reject(stderr);
                    }
                });

                this._cancellable.connect(() => proc.force_exit());
            } catch (e) {
                logError('ERROR: Python execution failed: ' + e);
            }
        });
    }

    cancel() {
        if (this._cancellable instanceof Gio.Cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
    }
}
