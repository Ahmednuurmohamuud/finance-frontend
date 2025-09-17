// // service/accounts.ts
// import api from "./api";

// export interface Account {
//   id: number;
//   name: string;
//   type: string;
//   balance: number;
//   currency: string;
// }

// // Get all accounts
// export const getAccounts = async (): Promise<Account[]> => {
//   const res = await api.get("/accounts/");
//   return res.data;
// };

// // Get account by ID
// export const getAccount = async (id: number): Promise<Account> => {
//   const res = await api.get(`/accounts/${id}/`);
//   return res.data;
// };

// // Create new account
// export const createAccount = async (data: Partial<Account>): Promise<Account> => {
//   const res = await api.post("/accounts/", data);
//   return res.data;
// };

// // Update account
// export const updateAccount = async (id: number, data: Partial<Account>): Promise<Account> => {
//   const res = await api.put(`/accounts/${id}/`, data);
//   return res.data;
// };

// // Delete account
// export const deleteAccount = async (id: number): Promise<void> => {
//   await api.delete(`/accounts/${id}/`);
// };
