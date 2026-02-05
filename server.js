const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://landing-page-base-drzy.onrender.com/', 'https://tudominio.com'] 
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'Origen no permitido por CORS';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
// Usamos path.resolve para asegurar la ruta absoluta
app.use(express.static(path.resolve(__dirname, 'public')));

// Configurar Nodemailer
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, 
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });
  } else {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  }
};

const transporter = createTransporter();

// Ruta para enviar correo
app.post('/enviar-correo', async (req, res) => {
  console.log('📨 Solicitud POST recibida en /enviar-correo');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('❌ Faltan variables de entorno');
    return res.status(500).json({ 
      success: false, 
      message: 'Error de configuración del servidor' 
    });
  }

  const { name, email, phone, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Por favor completa los campos requeridos'
    });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.GMAIL_USER}>`,
    replyTo: email,
    to: process.env.GMAIL_USER,
    subject: `📧 Nuevo mensaje de contacto de ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>📌 Nombre:</strong> ${name}</p>
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>📱 Teléfono:</strong> ${phone || 'No proporcionado'}</p>
        <p><strong>💬 Mensaje:</strong></p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Enviado desde Medellín By Night Tours - ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    text: `Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nMensaje: ${message}`
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado: ${info.messageId}`);
    res.json({ 
      success: true, 
      message: '¡Correo enviado exitosamente!' 
    });
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al enviar el correo'
    });
  }
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: process.env.NODE_ENV || 'development' });
});

// Ruta principal explícita
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// 🔴 SOLUCIÓN FINAL: Usar una RegEx para capturar todo
// Esto evita que la librería path-to-regexp intente buscar nombres de parámetros
app.get(/^(?!\/(enviar-correo|health)).*$/, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Modo: ${process.env.NODE_ENV || 'development'}`);
});