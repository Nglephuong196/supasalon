export class LoggerService {
  static async logError(request: Request, response: Response) {
    try {
      const timestamp = new Date().toISOString();
      const method = request.method;
      const url = request.url;
      const status = response.status;
      const statusText = response.statusText;

      // Clone response to read body without consuming the original stream
      const responseClone = response.clone();
      let body = "";
      try {
        body = await responseClone.text();
      } catch (e) {
        body = "[Could not read body]";
      }
      console.error(
        `[${timestamp}] ${method} ${url} - ${status} ${statusText}\nResponse Body: ${body}`,
      );
    } catch (error) {
      console.error("Failed to log error:", error);
    }
  }
}
