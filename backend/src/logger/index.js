const levels = ["debug", "info", "warn", "error"];

function write(level, message, meta) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ? { meta } : {})
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = Object.fromEntries(
  levels.map((level) => [level, (message, meta) => write(level, message, meta)])
);
