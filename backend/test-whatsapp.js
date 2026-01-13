require('dotenv').config();
const whatsappService = require('./services/whatsappService');

/**
 * Script de prueba para WhatsApp Business API
 * Este script enviará una notificación de prueba al ADMINISTRADOR
 */

async function testWhatsAppAdmin() {
    console.log('🚀 Iniciando prueba de WhatsApp para ADMINISTRADOR...\n');

    // Datos de prueba de una venta
    const testUser = {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        dni: '12345678',
        celular: '+51987654321'
    };

    const testRaffleNumber = 42;
    const testAmount = 5.00;

    try {
        // Verificar configuración
        if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
            throw new Error('❌ WHATSAPP_PHONE_NUMBER_ID no está configurado en .env');
        }
        if (!process.env.WHATSAPP_ACCESS_TOKEN) {
            throw new Error('❌ WHATSAPP_ACCESS_TOKEN no está configurado en .env');
        }
        if (!process.env.WHATSAPP_ADMIN_NUMBER) {
            throw new Error('❌ WHATSAPP_ADMIN_NUMBER no está configurado en .env');
        }

        console.log('✅ Configuración encontrada');
        console.log('📱 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
        console.log('🎯 Admin recibirá notificación:', process.env.WHATSAPP_ADMIN_NUMBER);
        console.log('');

        // Test: Notificación de compra al administrador
        console.log('📨 Enviando notificación de venta al administrador...');
        await whatsappService.sendAdminPurchaseNotification(
            testUser,
            [testRaffleNumber],
            testAmount
        );
        console.log('✅ Notificación enviada exitosamente!\n');

        console.log('🎉 ¡Prueba completada!');
        console.log(`📱 Verifica el WhatsApp del número ${process.env.WHATSAPP_ADMIN_NUMBER}`);
        console.log('   Deberías recibir un mensaje con los detalles de la venta de prueba\n');

    } catch (error) {
        console.error('\n❌ Error durante la prueba:');
        console.error('Mensaje:', error.message);

        if (error.response?.data) {
            console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
        }

        console.log('\n📝 Sugerencias:');
        console.log('- Verifica que las credenciales en .env sean correctas');
        console.log('- Confirma que el número de administrador esté en formato internacional (+51...)');
        console.log('- Revisa que el token de acceso no haya expirado');
        console.log('- Asegúrate de usar el número de prueba de WhatsApp durante el desarrollo\n');
    }
}

// Ejecutar prueba
testWhatsAppAdmin();
