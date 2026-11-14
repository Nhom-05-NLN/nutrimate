const disclaimer = 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.';
const flexibleDisclaimer = disclaimer
  .split(/\s+/)
  .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('\\s+');
const repeatedDisclaimer = new RegExp(`(?:${flexibleDisclaimer})(?:\\s*(?:${flexibleDisclaimer}))+`, 'giu');
const tableSeparator = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/;

function parseTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
}

function formatMarkdownTable(lines: string[], start: number): { text: string; nextLine: number } {
  const headers = parseTableRow(lines[start] ?? '');
  const rows: string[][] = [];
  let nextLine = start + 2;

  while (nextLine < lines.length && lines[nextLine]?.includes('|')) {
    rows.push(parseTableRow(lines[nextLine] ?? ''));
    nextLine++;
  }

  const formattedRows = rows.map(row => {
    const title = row[0] || 'Gợi ý';
    const details = headers.slice(1).flatMap((header, index) => {
      const value = row[index + 1];
      return value ? [`  ${header || 'Thông tin'}: ${value}`] : [];
    });
    return [`• ${title}`, ...details].join('\n');
  });

  return { text: formattedRows.join('\n\n'), nextLine };
}

export function formatChatMessage(text: string): string {
  const normalizedText = text.replace(/\*\*/g, '').replace(repeatedDisclaimer, disclaimer);
  const lines = normalizedText.split(/\r?\n/);
  const formattedLines: string[] = [];

  for (let index = 0; index < lines.length;) {
    if (lines[index]?.includes('|') && tableSeparator.test(lines[index + 1] ?? '')) {
      const table = formatMarkdownTable(lines, index);
      if (table.text) formattedLines.push(table.text);
      index = table.nextLine;
      continue;
    }

    formattedLines.push(lines[index] ?? '');
    index++;
  }

  return formattedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
