import * as Utils from './utils.js';
import {UPOWER_DEVICES_SCRIPT_PATH} from './constants.js';

export class UPowerController {
    constructor(dir) {
        this.dir = dir;
        this._pythonRunner = new Utils.ScriptRunner();
    }

    async getDevices() {
        const shellLocation = this.dir.get_child(UPOWER_DEVICES_SCRIPT_PATH).get_path();

        let uPowerDevices = [];
        try {
            const stdout = await this._pythonRunner.runScriptAsync([shellLocation]);
            uPowerDevices = JSON.parse(stdout);
        } catch (error) {
            logError('Error in getDevices' + error);
        }

        return uPowerDevices
            .filter((device) => device.serial)
            .map((device) => ({
                name: device.model,
                mac: device.serial,
                batteryPercentage: this._getPercentage(device.percentage),
                defaultIcon: device.icon,
                isConnected: true,
            }));
    }

    _getPercentage(text) {
        const match = text.match(/\d+%/);
        return match ? match[0] : '';
    }

    destroy() {
        this._pythonRunner.cancel();
    }
}
