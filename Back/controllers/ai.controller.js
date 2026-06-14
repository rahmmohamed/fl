require('dotenv').config();
const pool = require('../config/db');

const getBusinessContext = async () => {
  const summary = await pool.query(`
    SELECT
      COUNT(*) AS total_deals,
      COUNT(*) FILTER (WHERE stage = 'won') AS won,
      COUNT(*) FILTER (WHERE stage = 'lost') AS lost,
      COUNT(*) FILTER (WHERE stage IN ('new','negotiation')) AS open_deals
    FROM deals
  `);

  const revenue = await pool.query(`
    SELECT COALESCE(SUM(di.quantity * di.unit_price), 0) AS total_revenue
    FROM deals d JOIN deal_items di ON di.deal_id = d.id
    WHERE d.stage = 'won'
  `);

  const topProducts = await pool.query(`
    SELECT p.name, SUM(di.quantity) AS units_sold,
           SUM(di.quantity * di.unit_price) AS revenue
    FROM products p
    JOIN deal_items di ON di.product_id = p.id
    JOIN deals d ON d.id = di.deal_id
    WHERE d.stage = 'won'
    GROUP BY p.name ORDER BY revenue DESC LIMIT 3
  `);

  const topCustomers = await pool.query(`
    SELECT c.name, SUM(di.quantity * di.unit_price) AS revenue
    FROM customers c
    JOIN deals d ON d.customer_id = c.id
    JOIN deal_items di ON di.deal_id = d.id
    WHERE d.stage = 'won'
    GROUP BY c.name ORDER BY revenue DESC LIMIT 3
  `);

  const stalledDeals = await pool.query(`
    SELECT d.id, c.name AS customer_name, d.stage, d.created_at
    FROM deals d JOIN customers c ON c.id = d.customer_id
    WHERE d.stage IN ('new','negotiation')
      AND d.created_at < NOW() - INTERVAL '14 days'
    LIMIT 5
  `);

  return {
    deals: summary.rows[0],
    total_revenue: revenue.rows[0].total_revenue,
    top_products: topProducts.rows,
    top_customers: topCustomers.rows,
    stalled_deals: stalledDeals.rows,
  };
};

const getAdvice = async (req, res) => {
  try {
    const { message } = req.body;
    const context = await getBusinessContext();

    const prompt = `You are a CRM business advisor for a small company. Here is the current sales data:

${JSON.stringify(context, null, 2)}

The owner asks: "${message}"

Answer concisely (max 4-5 sentences), be practical and reference real numbers from the data. Give 1-2 actionable suggestions if relevant.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(500).json({ error: 'AI API error' });
    }

    const advice = data.choices[0].message.content;
    res.json({ advice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get AI advice' });
  }
};

module.exports = { getAdvice };
