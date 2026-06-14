import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:5000/api/ai';

export const askAdvisor = createAsyncThunk('chatbot/ask', async (message) => {
  const res = await fetch(`${API_URL}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to get advice');
  const data = await res.json();
  return data.advice;
});

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState: {
    messages: [
      { role: 'assistant', content: "Hi! Ask me about your sales, top customers, or what you should focus on this week." },
    ],
    loading: false,
    error: null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askAdvisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(askAdvisor.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({ role: 'assistant', content: action.payload });
      })
      .addCase(askAdvisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.messages.push({ role: 'assistant', content: "Sorry, I couldn't process that. Please try again." });
      });
  },
});

export const { addUserMessage } = chatbotSlice.actions;
export default chatbotSlice.reducer;
