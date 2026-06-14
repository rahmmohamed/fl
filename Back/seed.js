require('dotenv').config();
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const STAGES = ['new', 'negotiation', 'won', 'lost'];
const STATUSES = ['lead', 'active', 'churned'];
const CATEGORIES = ['Software', 'Hardware', 'Service', 'Subscription'];

async function seed() {
  console.log('Clearing old data...');
  await pool.query('TRUNCATE deal_items, deals, customers, products, employees RESTART IDENTITY CASCADE');

  console.log('Seeding employees...');
  const employeeIds = [];
  for (let i = 0; i < 5; i++) {
    const res = await pool.query(
      `INSERT INTO employees (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
      [faker.person.fullName(), faker.internet.email(), 'fakehash123', i === 0 ? 'owner' : 'sales_rep']
    );
    employeeIds.push(res.rows[0].id);
  }

  console.log('Seeding products...');
  const productIds = [];
  const productPrices = {};
  for (let i = 0; i < 10; i++) {
    const price = parseFloat(faker.commerce.price({ min: 20, max: 2000 }));
    const res = await pool.query(
      `INSERT INTO products (name, description, price, stock, category, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        price,
        faker.number.int({ min: 0, max: 200 }),
        faker.helpers.arrayElement(CATEGORIES),
      ]
    );
    productIds.push(res.rows[0].id);
    productPrices[res.rows[0].id] = price;
  }

  console.log('Seeding customers...');
  const customerIds = [];
  for (let i = 0; i < 30; i++) {
    const res = await pool.query(
      `INSERT INTO customers (name, email, phone, company, status, assigned_to, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        faker.person.fullName(),
        faker.internet.email(),
        faker.phone.number({ style: 'international' }).slice(0, 20),
        faker.company.name(),
        faker.helpers.arrayElement(STATUSES),
        faker.helpers.arrayElement(employeeIds),
        faker.lorem.sentence(),
      ]
    );
    customerIds.push(res.rows[0].id);
  }

  console.log('Seeding deals...');
  for (let i = 0; i < 80; i++) {
    const createdAt = faker.date.recent({ days: 90 });
    const stage = faker.helpers.arrayElement(STAGES);
    const closedAt = (stage === 'won' || stage === 'lost')
      ? faker.date.between({ from: createdAt, to: new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) })
      : null;

    const dealRes = await pool.query(
      `INSERT INTO deals (customer_id, employee_id, stage, created_at, closed_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        faker.helpers.arrayElement(customerIds),
        faker.helpers.arrayElement(employeeIds),
        stage,
        createdAt,
        closedAt,
      ]
    );
    const dealId = dealRes.rows[0].id;

    const itemCount = faker.number.int({ min: 1, max: 3 });
    const usedProducts = faker.helpers.arrayElements(productIds, itemCount);
    for (const productId of usedProducts) {
      await pool.query(
        `INSERT INTO deal_items (deal_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [dealId, productId, faker.number.int({ min: 1, max: 5 }), productPrices[productId]]
      );
    }
  }

  console.log('✓ Done seeding!');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  pool.end();
});
