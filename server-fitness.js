// Dependências: npm install express cors axios dotenv
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_SEU_TOKEN_DO_ASAAS';

// Rota para criar o Pix no Asaas
app.post('/criar-pix-fitness', async (req, res) => {
    const { nome, telefone, cep, tamanho } = req.body;

    try {
        // 1. Criar ou buscar cliente no Asaas (aqui usando um ID genérico ou criando dinâmico)
        const response = await axios.post('https://www.asaas.com/api/v3/payments', {
            customer: 'cus_000005892543', 
            billingType: 'PIX',
            value: 70.90, // R$ 1,00 (Kit) + R$ 69,90 (Frete Logístico)
            dueDate: new Date().toISOString().split('T')[0],
            description: `Shark Fitness - Kit 50 Peças (Tamanho ${tamanho})`,
            externalReference: JSON.stringify({ nome, telefone, cep, tamanho })
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const paymentId = response.data.id;

        // 2. Buscar o QR Code e o Copia e Cola
        const qrResponse = await axios.get(`https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        res.json({
            success: true,
            payload: qrResponse.data.payload,
            encodedImage: qrResponse.data.encodedImage
        });

    } catch (error) {
        console.error('Erro Asaas:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao gerar Pix.' });
    }
});

// Webhook que o Asaas chama automaticamente quando o cliente paga
app.post('/webhook-asaas', async (req, res) => {
    try {
        const { event, payment } = req.body;

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const dadosCliente = JSON.parse(payment.externalReference);
            console.log(`[PAGAMENTO APROVADO] Kit Shark Fitness 50 Peças vendido para ${dadosCliente.nome} (${dadosCliente.telefone})`);
            // Aqui você pode disparar a notificação para o seu WhatsApp/sistema de logística
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro Webhook:', error);
        res.status(500).send('ERROR');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Shark Fitness rodando na porta ${PORT}`));
