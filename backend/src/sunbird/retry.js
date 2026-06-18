export async function withRetry(task, { attempts = 3, delayMs = 500, shouldRetry = () => true } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts && shouldRetry(error)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else {
        break;
      }
    }
  }

  throw lastError;
}
