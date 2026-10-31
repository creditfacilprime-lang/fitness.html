// ROTA PARA GERAR PIX DO KIT FITNESS (R$ 1,00 Produto + R$ 39,90 Frete = R$ 40,90 Total)
app.post('/criar-pix-fitness', async (req, res) => {
    const { telefone, nome, cep, tamanho } = req.body;

    try {
        const response = await axios.post('https://www.asaas.com/api/v3/payments', {
            customer: 'cus_000005892543', 
            billingType: 'PIX',
            value: 40.90, // R$ 1,00 + R$ 39,90 frete
            dueDate: new Date().toISOString().split('T')[0],
            description: `Kit Fitness 15 Peças (Tamanho ${tamanho}) - Promoção R$ 1,00 + Frete`,
            externalReference: JSON.stringify({ telefone, tamanho, cep })
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const paymentId = response.data.id;

        const qrResponse = await axios.get(`https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        res.json({
            success: true,
            payload: qrResponse.data.payload,
            encodedImage: qrResponse.data.encodedImage
        });

    } catch (error) {
        console.error('Erro ao gerar Pix Fitness no Asaas:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao gerar pagamento do pedido.' });
    }
});
