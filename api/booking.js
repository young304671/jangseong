import { createHandler } from '../server/booking.js';
import { saveBooking } from '../server/google-sheets.js';
import { saveWithAppsScript } from '../server/apps-script.js';

export default createHandler({ save: (data, env) => env.BOOKING_APPS_SCRIPT_URL ? saveWithAppsScript(data, env) : saveBooking(data, env) });
