const pool = require('../config/db');

const getSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH this_week AS (
        SELECT
          COUNT(*) AS deal_count,
          COALESCE(SUM(di.quantity * di.unit_price), 0) AS revenue,
          COUNT(*) FILTER (WHERE d.stage = 'won') AS won_count
        FROM deals d
        LEFT JOIN deal_items di ON di.deal_id = d.id
        WHERE d.created_at >= date_trunc('week', NOW())
      ),
      last_week AS (
        SELECT
          COUNT(*) AS deal_count,
          COALESCE(SUM(di.quantity * di.unit_price), 0) AS revenue,
          COUNT(*) FILTER (WHERE d.stage = 'won') AS won_count
        FROM deals d
        LEFT JOIN deal_items di ON di.deal_id = d.id
        WHERE d.created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
          AND d.created_at < date_trunc('week', NOW())
      )
      SELECT
        tw.deal_count AS deals_this_week,
        lw.deal_count AS deals_last_week,
        tw.revenue AS revenue_this_week,
        lw.revenue AS revenue_last_week,
        tw.won_count AS won_this_week,
        lw.won_count AS won_last_week
      FROM this_week tw, last_week lw
    `);

    const row = result.rows[0];

    const pctChange = (current, previous) => {
      current = Number(current);
      previous = Number(previous);
      if (previous === 0) return current === 0 ? 0 : 100;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      deals: {
        value: Number(row.deals_this_week),
        change: pctChange(row.deals_this_week, row.deals_last_week),
      },
      revenue: {
        value: Number(row.revenue_this_week),
        change: pctChange(row.revenue_this_week, row.revenue_last_week),
      },
      won: {
        value: Number(row.won_this_week),
        change: pctChange(row.won_this_week, row.won_last_week),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getRevenueWeekly = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        date_trunc('week', d.closed_at) AS week,
        COALESCE(SUM(di.quantity * di.unit_price), 0) AS revenue
      FROM deals d
      JOIN deal_items di ON di.deal_id = d.id
      WHERE d.stage = 'won' AND d.closed_at IS NOT NULL
      GROUP BY week
      ORDER BY week
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTopCustomers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, COALESCE(SUM(di.quantity * di.unit_price), 0) AS total_revenue
      FROM customers c
      JOIN deals d ON d.customer_id = c.id
      JOIN deal_items di ON di.deal_id = d.id
      WHERE d.stage = 'won'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, SUM(di.quantity) AS units_sold,
             SUM(di.quantity * di.unit_price) AS total_revenue
      FROM products p
      JOIN deal_items di ON di.product_id = p.id
      JOIN deals d ON d.id = di.deal_id
      WHERE d.stage = 'won'
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getSummary, getRevenueWeekly, getTopCustomers, getTopProducts };
