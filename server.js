// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // se usar node 18+, pode usar global fetch
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

/* ======= Chat -> OpenAI Proxy (server-side) ======= */
app.post('/api/chat', async (req, res) => {
  try {
    const { text, lang = 'pt', cart } = req.body;
    if(!process.env.OPENAI_API_KEY) return res.status(500).json({message:'OPENAI_API_KEY not configured'});
    // Build a prompt with context: cart + user text
    const systemPrompt = `Você é um assistente de pedidos para uma lanchonete. Responda em ${lang === 'pt' ? 'português' : (lang==='en' ? 'english' : 'español')}. Seja direto e útil.`;
    const userPrompt = `Carrinho: ${JSON.stringify(cart || [])}\nUsuário: ${text}`;
    // Call OpenAI Chat Completions (Chat API)
    // NOTE: atualize o endpoint/params conforme a versão do OpenAI que você usa.
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // substitua se necessário; ou 'gpt-4o' etc
        messages: [
          {role:'system', content: systemPrompt},
          {role:'user', content: userPrompt}
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    const j = await openaiRes.json();
    if(openaiRes.status !== 200) {
      console.error('OpenAI error', j);
      return res.status(500).json({message: 'OpenAI error', detail: j});
    }
    const reply = j.choices?.[0]?.message?.content || 'Desculpe, não consegui responder.';
    res.json({reply});
  } catch(err){
    console.error(err);
    res.status(500).json({message:'Server error', error: err.message});
  }
});

/* ======= Pagamento (esqueleto) ======= */
app.post('/api/create-payment', async (req, res) => {
  // Exemplo simples: se method==='pix' -> cria payload PIX (simulado) e devolve QR via chart.googleapis.com
  try{
    const { method, cart } = req.body;
    const subtotal = (cart || []).reduce((s,it)=> s + (it.qty || 0) * (it.price || 0), 0);
    const total = subtotal; // sem frete neste exemplo
    if(method === 'pix'){
      // Gerar payload PIX simples (DEMO). Em produção gere payload válido com PSP.
      const chave = process.env.PAYMENT_KEY_PIX || 'seu@pix.exemplo';
      const payload = `PIX|chave:${chave}|valor:${total.toFixed(2)}|desc:PedidoWeb`;
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(payload)}`;
      return res.json({qrImageUrl: qrUrl, payload});
    } else if(method === 'card'){
      // Exemplo: se você tem um PSP que retorna checkoutUrl
      if(!process.env.PAYMENT_API_KEY) return res.status(500).json({message:'PAYMENT_API_KEY not configured'});
      // Aqui você chamaria a API do seu PSP com PAYMENT_API_KEY e dados do cart para criar pagamento
      // Retorne um checkoutUrl ou sessionId para o front redirecionar.
      return res.json({checkoutUrl: 'https://exemplo-psp-checkout.com/session/abc123'});
    } else {
      return res.status(400).json({message:'Método de pagamento inválido'});
    }
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Erro criando pagamento', error:err.message});
  }
});

/* ===== Optional: endpoint de tracking ===== */
app.get('/api/track', (req,res) => {
  // Esqueleto: em produção retorne status do pedido (preparing, on_the_way, delivered)
  res.json({status:'preparing'});
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
