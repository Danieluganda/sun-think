const SRT_TIME = /(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/;

export function parseSrt(input) {
  return String(input || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split("\n");
      const sequence = Number(lines[0]) || index + 1;
      const timeMatch = lines[1]?.match(SRT_TIME);

      if (!timeMatch) {
        throw new Error(`Invalid SRT timing at block ${sequence}`);
      }

      return {
        sequence,
        start: timeMatch[1],
        end: timeMatch[2],
        text: lines.slice(2).join("\n")
      };
    });
}
