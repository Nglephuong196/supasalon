import fs from 'fs';
import path from 'path';

export class LoggerService {
    private static LOG_FILE = 'failed_requests.log';

    static async logError(request: Request, response: Response) {
        try {
            const timestamp = new Date().toISOString();
            const method = request.method;
            const url = request.url;
            const status = response.status;
            const statusText = response.statusText;

            // Clone response to read body without consuming the original stream
            const responseClone = response.clone();
            let body = '';
            try {
                body = await responseClone.text();
            } catch (e) {
                body = '[Could not read body]';
            }

            const logEntry = `[${timestamp}] ${method} ${url} - ${status} ${statusText}\nResponse Body: ${body}\n----------------------------------------\n`;

            const logPath = path.resolve(this.LOG_FILE);

            // Append to log file
            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Failed to log error:', error);
        }
    }
}
