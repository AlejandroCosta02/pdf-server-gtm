const fs = require('fs');
const axios = require('axios');

async function testGeneratePDF() {
  const data = {
    marca: {
      marca: 'Mi Marca de Prueba',
      clases: ['35', '41'],
      titulares: [
        { fullName: 'Juan Perez' },
        { fullName: 'Maria Gomez' }
      ]
    },
    user: {
      name: 'Admin'
    }
  };

  try {
    const response = await axios.post('http://localhost:3001/generate-pdf', data, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' }
    });
    fs.writeFileSync('test-informe-marca.pdf', response.data);
    console.log('PDF saved as test-informe-marca.pdf');
  } catch (err) {
    console.error('Error generating PDF:', err.response?.data || err.message);
  }
}

testGeneratePDF(); 