import { configureStore } from '@reduxjs/toolkit'
import customersReducer from '../features/customers/customersSlice'
import productsReducer from '../features/products/productsSlice'
import dealsReducer from '../features/deals/dealsSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import chatbotReducer from '../features/chatbot/chatbotSlice'

export const store = configureStore({
  reducer: {
    customers: customersReducer,
    products: productsReducer,
    deals: dealsReducer,
    dashboard: dashboardReducer,
    chatbot: chatbotReducer,
  },
})
