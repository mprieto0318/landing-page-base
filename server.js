const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔴 CORS para producción - configura específicamente
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://tudominio.onrender.com', 'https://tudominio.com'] // Cambia esto
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: function (origin, callback) {
    // Permite solicitudes sin origen (como apps móviles o curl)
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
app.use(express.static('public'));

// 🔴 Configurar Nodemailer para PRODUCCIÓN (Render/Heroku/Railway)
const createTransporter = () => {
  // En producción, usa la configuración específica
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      tls: {
        // 🔴 IMPORTANTE para Render/Railway
        rejectUnauthorized: false
      },
      // Timeouts más largos para producción
      connectionTimeout: 30000, // 30 segundos
      greetingTimeout: 30000,
      socketTimeout: 30000
    });
  } else {
    // Para desarrollo local
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
  
  // 🔴 Verificar que tenemos las variables de entorno
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('❌ Faltan variables de entorno GMAIL_USER o GMAIL_PASS');
    return res.status(500).json({ 
      success: false, 
      message: 'Error de configuración del servidor' 
    });
  }

  const { name, email, phone, message } = req.body;
  
  // 🔴 Validar campos requeridos
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Por favor completa los campos requeridos: Nombre, Email y Mensaje'
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Por favor ingresa un email válido'
    });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.GMAIL_USER}>`, // 🔴 Cambia esto
    replyTo: email, // Para que puedas responder directamente
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
          Enviado desde tu landing page - ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    text: `Nuevo mensaje de contacto:\n\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nMensaje: ${message}`
  };

  try {
    console.log('🔄 Intentando enviar correo...');
    
    // Verificar conexión primero
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');
    
    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado: ${info.messageId}`);
    
    res.json({ 
      success: true, 
      message: '¡Correo enviado exitosamente! Te contactaremos pronto.' 
    });
    
  } catch (error) {
    console.error('❌ Error detallado enviando correo:', error);
    
    // Mensajes de error más específicos
    let errorMessage = 'Error al enviar el correo';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verifica las credenciales de Gmail.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Error de conexión con el servidor de correo.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔴 Ruta para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Para SPA - redirigir todas las rutas a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email configurado: ${process.env.GMAIL_USER ? 'Sí' : 'No'}`);
});