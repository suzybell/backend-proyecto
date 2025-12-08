// utils/mailer.js - Versión para Mailtrap
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar correos
const enviarCorreo = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Mi E-commerce" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log('📧 Correo enviado:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        return false;
    }
};

module.exports = { enviarCorreo };