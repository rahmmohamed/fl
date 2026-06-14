const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customersRoutes = require('./routes/customers.routes');
const productsRoutes = require('./routes/products.routes');
const dealsRoutes = require('./routes/deals.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
