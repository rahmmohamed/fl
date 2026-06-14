const pool = require('../config/db');

const getDeals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.name AS customer_name, e.name AS employee_name,
             COALESCE(SUM(di.quantity * di.unit_price), 0) AS total_amount
      FROM deals d
      JOIN customers c ON c.id = d.customer_id
      LEFT JOIN employees e ON e.id = d.employee_id
      LEFT JOIN deal_items di ON di.deal_id = d.id
      GROUP BY d.id, c.name, e.name
      ORDER BY d.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealResult = await pool.query(`
      SELECT d.*, c.name AS customer_name, e.name AS employee_name
      FROM deals d
      JOIN customers c ON c.id = d.customer_id
      LEFT JOIN employees e ON e.id = d.employee_id
      WHERE d.id = $1
    `, [id]);

    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    const itemsResult = await pool.query(`
      SELECT di.*, p.name AS product_name
      FROM deal_items di
      JOIN products p ON p.id = di.product_id
      WHERE di.deal_id = $1
    `, [id]);

    res.json({ ...dealResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createDeal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_id, employee_id, stage, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Deal must have at least one item' });
    }

    await client.query('BEGIN');

    const dealResult = await client.query(
      `INSERT INTO deals (customer_id, employee_id, stage) VALUES ($1, $2, $3) RETURNING *`,
      [customer_id, employee_id || null, stage || 'new']
    );
    const deal = dealResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO deal_items (deal_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [deal.id, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...deal, items });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, employee_id, stage, closed_at } = req.body;
    const result = await pool.query(
      `UPDATE deals SET customer_id=$1, employee_id=$2, stage=$3, closed_at=$4
       WHERE id=$5 RETURNING *`,
      [customer_id, employee_id || null, stage, closed_at || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM deals WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDeals, getDealById, createDeal, updateDeal, deleteDeal };
