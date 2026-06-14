import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:5000/api/deals';

export const fetchDeals = createAsyncThunk('deals/fetch', async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch deals');
  return res.json();
});

export const addDeal = createAsyncThunk('deals/add', async (deal) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  });
  if (!res.ok) throw new Error('Failed to add deal');
  return res.json();
});

export const updateDeal = createAsyncThunk('deals/update', async ({ id, ...data }) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update deal');
  return res.json();
});

export const deleteDeal = createAsyncThunk('deals/delete', async (id) => {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete deal');
  return id;
});

const dealsSlice = createSlice({
  name: 'deals',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addDeal.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateDeal.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      });
  },
});

export default dealsSlice.reducer;
