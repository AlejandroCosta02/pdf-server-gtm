const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Real logo base64 (from public/logo.png)
const LOGO_BASE64 = `iVBORw0KGgoAAAANSUhEUgAAAXgAAAHdCAMAAAAgkpLJAAAAVFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8UXluqAAAAGnRSTlMAAwQLDQ9CRUZKTVSztrq+v8Lx8vP09fb7/ABHPsQAAAABYktHRBsCYNSkAAADCUlEQVR42u3YsWrDMBRAUctRUnAw9f//pAkZUhyr7ix3jiTQudubnjmINzhcxqGFjqGvUpynQeVbRwZ1Ag8evMCDF3jwAg9e4MELfDvF0/xOn9oUQjZe8zGlvtyPM/xjK7T5+56N69bZi3dqwIMXePACD17gwQs8eIEHDx4BePACD17gwQs8eIEHL/DgwQs8eIEHL/DgBR68wIMXePDgBR68wIMXePACD17gwQs8ePACD17gwQs8eIEHL/DgBR48eIEHL/DgBR68wIMXePACDx68wIMXePACD17gwQs8eIEHD17gwQs8eIEHL/DgBR68wIMHL/DgBR68wIMXePACD17gwYMXePACD17gwQs8eIEHL/DgwQs8eIEHL/DgBR68wIMXePDgBR68wIMXePACD17gwQs8ePACD17gwQs8eIEHL/DgBR48eIEHL/DgBR68wIMXePACDx68wIMXePACD17gwQs8eIEHD17gwQs8eIEHL/DgBR68wIMHL/DgBR68wIMXePACD17gwYMXePACD17gwQs8eIEHL/DgwQs8eIEHL/DgBR68wIMXePDgBR68wIMXePACD17gwQs8ePACD17gwQs8eIEHL/DgBR48eIEHL/DgBR68wIMXePACDx68wIMXePACD17gwQs8eIEHD17gwQs8eIEHL/DgBR68wIMHL/DgBR68wIMXePACDx48AvDgBR68wIMXePACD17/i+f5KLQ4tLF3vNbZO4Rl8voqtDo1bjx4gQcv8OAFHrzAgxd48N0X9x8IFfr9AyeLIM1Tq/BpAAAAAElFTkSuQmCC`;

function generateHTML(marca, user) {
  // Helper for clase rows
  const claseRows = (Array.isArray(marca.clases) ? marca.clases : []).map(clase => `
    <tr>
      <td>${clase.numero || ''}</td>
      <td>${clase.acta || ''}</td>
      <td>${clase.resolucion || ''}</td>
    </tr>
  `).join('');

  // Helper for fechas importantes (collect all from clases, flatten, dedupe, take 2)
  let fechasImportantes = [];
  if (Array.isArray(marca.clases)) {
    fechasImportantes = marca.clases
      .flatMap(clase => clase.fechas_importantes || [])
      .filter(Boolean)
      .slice(0, 2);
  }

  // Helper for titulares
  const titulares = (Array.isArray(marca.titulares) ? marca.titulares : []).map(t => `
    <div class="titular-box">
      <div><strong>Nombre:</strong> ${t.fullName || ''}</div>
      <div><strong>Email:</strong> ${t.email || ''}</div>
      <div><strong>Teléfono:</strong> ${t.phone || ''}</div>
    </div>
  `).join('');

  const today = new Date().toLocaleDateString('es-AR');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Informe de Marca</title>
    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        background: #f7f9fb;
        color: #1a202c;
        margin: 0;
        padding: 0;
      }
      .header {
        background: #234099;
        color: #fff;
        padding: 32px 40px 24px 40px;
        display: flex;
        align-items: center;
        border-radius: 0 0 18px 18px;
      }
      .logo {
        width: 70px;
        height: 70px;
        background: #fff;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 32px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.10);
      }
      .logo img {
        width: 60px;
        height: 60px;
        object-fit: contain;
      }
      .header-content {
        flex: 1;
      }
      .report-title {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .report-subtitle {
        font-size: 1.1rem;
        font-weight: 400;
        opacity: 0.9;
      }
      .section {
        background: #fff;
        border-radius: 12px;
        margin: 32px 40px 0 40px;
        padding: 28px 32px;
        box-shadow: 0 2px 8px rgba(35,64,153,0.07);
      }
      .section-title {
        color: #234099;
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 18px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 6px;
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      .info-table th, .info-table td {
        border: 1px solid #e2e8f0;
        padding: 8px 10px;
        text-align: left;
        font-size: 0.98rem;
      }
      .info-table th {
        background: #f1f5fa;
        color: #234099;
        font-weight: 600;
      }
      .fechas-importantes {
        margin: 18px 0 0 0;
        padding: 0;
        list-style: none;
      }
      .fechas-importantes li {
        background: #eaf0fb;
        color: #234099;
        border-radius: 6px;
        display: inline-block;
        margin-right: 12px;
        padding: 6px 16px;
        font-weight: 500;
        font-size: 1rem;
      }
      .titular-box {
        background: #f1f5fa;
        border-radius: 8px;
        padding: 10px 16px;
        margin-bottom: 10px;
        border-left: 4px solid #234099;
      }
      .footer {
        background: #234099;
        color: #fff;
        text-align: center;
        font-size: 0.95rem;
        padding: 18px 40px 12px 40px;
        border-radius: 0 0 18px 18px;
        margin-top: 40px;
      }
      .footer .date {
        font-weight: 600;
      }
      .footer .confidential {
        font-size: 0.92rem;
        opacity: 0.85;
        margin-top: 4px;
      }
      .user-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px 32px;
        margin-top: 12px;
      }
      .user-info-label {
        font-weight: 600;
        color: #234099;
        font-size: 1rem;
      }
      .user-info-value {
        font-size: 1rem;
        color: #1a202c;
        margin-bottom: 4px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">
        <img src="data:image/png;base64,${LOGO_BASE64}" alt="Logo" />
      </div>
      <div class="header-content">
        <div class="report-title">Informe de Marca</div>
        <div class="report-subtitle">Reporte profesional</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Información del Usuario</div>
      <div class="user-info-grid">
        <div>
          <div class="user-info-label">Nombre</div>
          <div class="user-info-value">${user?.name || ''}</div>
        </div>
        <div>
          <div class="user-info-label">Email</div>
          <div class="user-info-value">${user?.email || ''}</div>
        </div>
        <div>
          <div class="user-info-label">Teléfono</div>
          <div class="user-info-value">${user?.contact_number || ''}</div>
        </div>
        <div>
          <div class="user-info-label">N° de Matrícula</div>
          <div class="user-info-value">${user?.agent_number || ''}</div>
        </div>
        <div>
          <div class="user-info-label">Provincia</div>
          <div class="user-info-value">${user?.province || ''}</div>
        </div>
        <div>
          <div class="user-info-label">Código Postal</div>
          <div class="user-info-value">${user?.zip_code || ''}</div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Información de la Marca</div>
      <div><strong>Nombre de la Marca:</strong> ${marca.marca || ''}</div>
      <table class="info-table">
        <thead>
          <tr>
            <th>Clase</th>
            <th>Acta</th>
            <th>Resolución</th>
          </tr>
        </thead>
        <tbody>
          ${claseRows}
        </tbody>
      </table>
      ${fechasImportantes.length > 0 ? `<div><strong>Fechas Importantes:</strong><ul class="fechas-importantes">${fechasImportantes.map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Titular(es)</div>
      ${titulares}
    </div>
    <div class="footer">
      Informe generado por Gestionatusmarcas.com | Plataforma profesional para agentes de marcas<br>
      <span class="date">Fecha de generación: ${today}</span> | Este documento es confidencial y sólo para uso informativo.<br>
      <span class="confidential">Gestión inteligente de tu cartera marcaria. Protección con visión profesional.</span>
    </div>
  </body>
  </html>
  `;
}

app.post('/generate-pdf', async (req, res) => {
  const { marca, user } = req.body;
  if (!marca) {
    return res.status(400).json({ error: 'Missing marca data' });
  }
  try {
    const html = generateHTML(marca, user);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="informe-marca.pdf"'
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PDF server running on port ${PORT}`);
}); 