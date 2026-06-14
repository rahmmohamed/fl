import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:5000/api/dashboard';

export const fetchDashboard = createAsyncThunk('dashboard/fetchAll', async () => {
  const [summaryRes, revenueRes, customersRes, productsRes] = await Promise.all([
    fetch(`${API_URL}/summary`),
    fetch(`${API_URL}/revenue-weekly`),
    fetch(`${API_URL}/top-customers`),
    fetch(`${API_URL}/top-products`),
  ]);

  if (!summaryRes.ok || !revenueRes.ok || !customersRes.ok || !productsRes.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const [summary, revenueWeekly, topCustomers, topProducts] = await Promise.all([
    summaryRes.json(),
    revenueRes.json(),
    customersRes.json(),
    productsRes.json(),
  ]);

  return { summary, revenueWeekly, topCustomers, topProducts };
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    summary: null,
    revenueWeekly: [],
    topCustomers: [],
    topProducts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.revenueWeekly = action.payload.revenueWeekly;
        state.topCustomers = action.payload.topCustomers;
        state.topProducts = action.payload.topProducts;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default dashboardSlice.reducer;
