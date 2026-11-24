import express from 'express';
import cors from 'cors';
import ratelimit from 'express-rate-limit';
import { pool } from './db.js';
import transactionsRouter from './transactions.js';

const app = express();
app.use(ratelimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
}));
const PORT = process.env.PORT || 5000;

app.use(cors({origin: 'http://localhost:4200'}));
app.use(express.json());
app.use('/api/transactions', transactionsRouter);


// GET semua expense
app.get('/api/expenses', async (req, res,next) => {
    try {
        const { rows } = await pool.query('SELECT id, title, amount, category, created_at FROM expenses ORDER BY created_at DESC');
        
        res.json(rows.map((row) => ({...row, amount: Number(row.amount)})));
    } catch (error) {
        next(error);
    }
});

// POST expense baru
app.post('/api/expenses', async (req, res,next) => {
    const body = req.body?? {};
    const title = String(body.title ?? "").trim();
    const amount = Number(body.amount ?? 0);
    const category = String(body.category ?? "").trim();

    if (!title || !(amount > 0)){
        return res.status(400).json({ error: "Title and amount are required, and amount must be greater than 0." });    
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO expenses (title, amount, category) VALUES ($1, $2, $3) RETURNING id, title, amount, category, created_at',
            [title, amount, category]
        );
        const[expense] = rows;
        res.status(201).json({...expense, amount: Number(expense.amount)});
    } catch (error) {
        next(error);
    }
});

// DELETE expense 
app.delete('/api/expenses/:id', async (req, res,next) => {
    const id = Number(req.params.id);
    if(!Number.isInteger(id)){
        return res.status(400).json({ error: "Invalid expense ID." });
    }
    try {
        const { rows } = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Expense not found." });
        }
        res.json({ message: "Expense deleted successfully." });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

