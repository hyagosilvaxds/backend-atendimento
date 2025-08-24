// Teste da função cleanChatId
const testCases = [
  {
    input: '553898817400:18@s.whatsapp.net',
    expected: '553898817400@s.whatsapp.net',
    description: 'Remove :18 do chatId'
  },
  {
    input: '5511999999999:42@c.us',
    expected: '5511999999999@c.us',
    description: 'Remove :42 do chatId em grupo'
  },
  {
    input: '553898817400@s.whatsapp.net',
    expected: '553898817400@s.whatsapp.net',
    description: 'Mantém chatId sem :'
  },
  {
    input: '120363047204838885@g.us',
    expected: '120363047204838885@g.us',
    description: 'Mantém grupo sem :'
  },
  {
    input: '553898817400:18:25@s.whatsapp.net',
    expected: '553898817400@s.whatsapp.net',
    description: 'Remove múltiplos :XX'
  },
  {
    input: '',
    expected: '',
    description: 'Trata string vazia'
  },
  {
    input: 'invalid-format',
    expected: 'invalid-format',
    description: 'Mantém formato inválido'
  }
];

function cleanChatId(chatId: string): string {
  if (!chatId) return chatId;
  
  // Se contém ':' antes do '@', remove tudo entre ':' e '@'
  if (chatId.includes(':') && chatId.includes('@')) {
    const parts = chatId.split('@');
    if (parts.length === 2) {
      const beforeAt = parts[0];
      const afterAt = parts[1];
      
      // Se há ':' na primeira parte, remove tudo a partir do ':'
      if (beforeAt.includes(':')) {
        const cleanBeforeAt = beforeAt.split(':')[0];
        return `${cleanBeforeAt}@${afterAt}`;
      }
    }
  }
  
  return chatId;
}

console.log('🧪 Testando função cleanChatId:');
console.log('================================');

testCases.forEach((testCase, index) => {
  const result = cleanChatId(testCase.input);
  const passed = result === testCase.expected;
  const status = passed ? '✅' : '❌';
  
  console.log(`${status} Teste ${index + 1}: ${testCase.description}`);
  console.log(`   Input:    "${testCase.input}"`);
  console.log(`   Expected: "${testCase.expected}"`);
  console.log(`   Result:   "${result}"`);
  
  if (!passed) {
    console.log(`   ❌ FALHOU!`);
  }
  console.log('');
});

console.log('🎯 Teste concluído!');
