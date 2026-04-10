import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import ExpenseChart from './ExpenseChart';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';

const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, summaryData, trendsData] = await Promise.all([
        expenseService.getExpenses(),
        expenseService.getExpenseSummary(),
        expenseService.getExpenseTrends()
      ]);

      setExpenses(expensesData.expenses);
      setSummary(summaryData.summary);
      setTrends(trendsData.trends);
    } catch (error) {
      console.error('Error loading expense data:', error);
    }
  };

  const handleCreateExpense = async (expenseData) => {
    try {
      await expenseService.createExpense(expenseData);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  return (
    <div className="expense-dashboard">
      <div className="dashboard-header">
        <h1>Expense Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Expense
        </button>
      </div>

      {summary && (
        <div className="summary-cards">
          <div className="card">
            <h3>Total Expenses</h3>
            <p>KES {summary.total_expenses.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3>This Month</h3>
            <p>KES {summary.current_month_expenses.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3>Average Monthly</h3>
            <p>KES {summary.average_monthly_expenses.toLocaleString()}</p>
          </div>
        </div>
      )}

      {trends.length > 0 && (
        <div className="chart-section">
          <h2>Expense Trends</h2>
          <ExpenseChart data={trends} />
        </div>
      )}

      <div className="expense-list-section">
        <h2>Recent Expenses</h2>
        <ExpenseList expenses={expenses} onUpdate={loadData} />
      </div>

      {showForm && (
        <ExpenseForm
          onSubmit={handleCreateExpense}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ExpenseDashboard;
