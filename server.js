const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// para subirlo en railway
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://use.fontawesome.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; " +
        "img-src 'self' data: https: blob:;" +
        "connect-src 'self' https://cdn.jsdelivr.net;" +
        "frame-src 'none';" +
        "object-src 'none'"
    );
    next();
});

app.use(express.static('public')); // Sirve archivos estáticos

// Configurar Nodemailer para Gmail 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

/*
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Puerto estándar con STARTTLS
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS // Debe ser la APP PASSWORD
    },
    tls: {
        rejectUnauthorized: false // Ayuda con certificados en Railway
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000
});
*/

// Ruta para enviar correo
app.post('/enviar-correo', async (req, res) => {

    // Agrega al inicio del try-catch:
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('Faltan variables de entorno GMAIL_USER o GMAIL_PASS');
        return res.status(500).json({ 
            success: false, 
            message: 'Error de configuración del .env servidor' 
        });
    }

    const { name, email, phone, message } = req.body;

    const mailOptions = {
        from: email,
        to: process.env.GMAIL_USER,
        subject: `Nuevo mensaje de contacto de ${name}`,
        html: `
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
            <p><strong>Mensaje:</strong> ${message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error enviando correo:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el correo' });
    }
});

// Ruta principal - sirve el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});