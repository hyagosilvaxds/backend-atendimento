const ExcelJS = require('exceljs');
const fs = require('fs');

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Contatos');

  // Definir colunas
  worksheet.columns = [
    { header: 'Nome', key: 'name', width: 20 },
    { header: 'Telefone', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Observações', key: 'notes', width: 40 }
  ];

  // Dados de teste com números problemáticos
  const testData = [
    {
      name: 'João Silva',
      phone: '+55 38 99155-3294',
      email: 'joao@email.com',
      notes: 'Número problemático com 9 extra'
    },
    {
      name: 'Maria Santos', 
      phone: '+55 38 9155-3294',
      email: 'maria@email.com',
      notes: 'Mesmo número sem 9 extra'
    },
    {
      name: 'Pedro Costa',
      phone: '+55 11 99999-8888',
      email: 'pedro@email.com', 
      notes: 'Número SP com 9'
    },
    {
      name: 'Ana Oliveira',
      phone: '+55 11 9999-8888',
      email: 'ana@email.com',
      notes: 'Número SP sem 9'
    },
    {
      name: 'Carlos Lima',
      phone: '+55 21 98765-4321',
      email: 'carlos@email.com',
      notes: 'Número inexistente RJ'
    },
    {
      name: 'Paula Rocha',
      phone: '+55 31 97777-1234', 
      email: 'paula@email.com',
      notes: 'Número inexistente BH'
    },
    {
      name: 'Roberto Alves',
      phone: '+55 11 1111-1111',
      email: 'roberto@email.com',
      notes: 'Número inválido todos iguais'
    },
    {
      name: 'Fernanda Cruz',
      phone: '554899887766',
      email: 'fernanda@email.com', 
      notes: 'Número sem formatação'
    },
    {
      name: 'Diego Souza',
      phone: '+55 11 91234-5678',
      email: 'diego@email.com',
      notes: 'Número normal válido'
    },
    {
      name: 'Camila Ferreira',
      phone: '',
      email: 'camila@email.com',
      notes: 'Sem telefone para teste'
    }
  ];

  // Adicionar dados
  testData.forEach(row => worksheet.addRow(row));

  // Salvar arquivo
  await workbook.xlsx.writeFile('test_import_contacts.xlsx');
  console.log('✅ Arquivo test_import_contacts.xlsx criado com sucesso!');
}

createTestExcel().catch(console.error);
