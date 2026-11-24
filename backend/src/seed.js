// daysAgo is relative to the client's local date, so "today" is right for the user.
const SEED = [
  { daysAgo: 0,  type: 'expense', title: 'Nasi goreng',         amount: 25000,   category: 'food' },
  { daysAgo: 0,  type: 'expense', title: 'Gojek ke kantor',     amount: 18000,   category: 'transport' },
  { daysAgo: 1,  type: 'expense', title: 'Kopi susu',           amount: 22000,   category: 'food' },
  { daysAgo: 2,  type: 'income',  title: 'Freelance logo',      amount: 1500000, category: 'other' },
  { daysAgo: 3,  type: 'expense', title: 'Groceries',           amount: 245000,  category: 'shopping' },
  { daysAgo: 4,  type: 'expense', title: 'Listrik PLN',         amount: 320000,  category: 'bills' },
  { daysAgo: 5,  type: 'expense', title: 'Bioskop',             amount: 80000,   category: 'entertainment' },
  { daysAgo: 6,  type: 'income',  title: 'Gaji bulanan',        amount: 8000000, category: 'salary' },
  { daysAgo: 7,  type: 'expense', title: 'Apotek',              amount: 56000,   category: 'health' },
  { daysAgo: 8,  type: 'expense', title: 'Bensin',              amount: 100000,  category: 'transport' },
  { daysAgo: 9,  type: 'expense', title: 'Sepatu',              amount: 450000,  category: 'shopping' },
  { daysAgo: 10, type: 'income',  title: 'Hadiah ulang tahun',  amount: 200000,  category: 'gift' },
  { daysAgo: 11, type: 'expense', title: 'Bakso',               amount: 30000,   category: 'food' },
  { daysAgo: 13, type: 'expense', title: 'Langganan streaming', amount: 54000,   category: 'entertainment' },
];

// Inserts the demo rows in one statement, inside the caller's transaction.
export async function insertSeed(client, guestId, localDate) {
  const params = [guestId];

  const rows = SEED.map((row) => {
    const i = params.length;
    params.push(row.type, row.title, row.amount, row.category, row.daysAgo, localDate);
    // this row's params are $(i+1) .. $(i+6)
    return `($1, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 6}::date - $${i + 5}::int)`;
  });

  await client.query(
    `INSERT INTO transactions (guest_id, type, title, amount, category, date)
     VALUES ${rows.join(', ')}`,
    params
  );
}