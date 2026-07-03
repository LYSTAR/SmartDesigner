module.exports = {
  // 每行最大宽度，超出才换行（原代码很多长行不换行）
  printWidth: 120,
  // 使用 2 个空格缩进
  tabWidth: 2,
  // 不使用 tab
  useTabs: false,
  // 不加分号（原始代码风格无分号）
  semi: false,
  // 使用单引号（原始代码风格）
  singleQuote: true,
  // 对象属性仅在必要时加引号
  quoteProps: 'as-needed',
  // JSX 中使用双引号
  jsxSingleQuote: false,
  // 尾随逗号：仅在 ES5 有效的地方加（对象、数组最后一项）
  trailingComma: 'es5',
  // 对象括号前后加空格：{ foo: bar }
  bracketSpacing: true,
  // JSX 闭合标签放在最后一个属性末尾，而不是新起一行
  bracketSameLine: false,
  // 箭头函数参数：仅一个参数时不加括号
  arrowParens: 'avoid',
  // Vue 文件中 script 和 style 标签内容不缩进
  vueIndentScriptAndStyle: false,
  // 换行符：lf（统一 Linux 风格，避免 Windows CRLF 造成 git diff）
  endOfLine: 'lf',
  // HTML 空白敏感度：css（保持 CSS display 的行为）
  htmlWhitespaceSensitivity: 'css',
  // HTML 每个属性是否单独一行（auto = 超过 printWidth 才换行）
  singleAttributePerLine: false,
}
