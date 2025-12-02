export interface DailyExpense {
    id: string;
    amount: number;
    remark: string;
    date: string; // ISO string
    createdBy: string; // User ID or Name
}
