module.exports = function (results) {
  // ANSI цвета
  const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    gray: '\x1b[90m',
  };

  let maxAllowed = null;

  const complexityMessages = results.flatMap((result) =>
    result.messages
      .filter((msg) => msg.ruleId === 'complexity')
      .map((msg) => {
        // Извлекаем число сложности и максимум
        const complexityMatch = msg.message.match(/complexity of (\d+)/);
        const maxAllowedMatch = msg.message.match(/Maximum allowed is (\d+)/);

        const complexity = complexityMatch
          ? parseInt(complexityMatch[1], 10)
          : 0;

        if (maxAllowedMatch && !maxAllowed) {
          [, maxAllowed] = maxAllowedMatch;
        }

        // Выбираем цвет
        let color = colors.green;
        if (complexity > 10) {
          color = colors.red;
        } else if (complexity > 5) {
          color = colors.yellow;
        }

        // Убираем часть "Maximum allowed is X" из сообщения
        const cleanMessage = msg.message.replace(
          /\. Maximum allowed is \d+\.?/,
          ''
        );

        return `${result.filePath}:${msg.line} - ${color}${cleanMessage}${colors.reset}`;
      })
  );

  let output = '';
  if (maxAllowed) {
    output += `${colors.gray}Maximum allowed complexity: ${maxAllowed}${colors.reset}\n\n`;
  }

  output +=
    complexityMessages.join('\n') ||
    `${colors.green}No complexity issues found${colors.reset}`;

  return output;
};
