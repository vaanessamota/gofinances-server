import csv from 'csv-parse';
import fs from 'fs';
import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';

interface Request {
  csvFilePath: string;
}

interface TransactionType {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFilePath }: Request): Promise<TransactionType[]> {
    const promise: Promise<TransactionType[]> = new Promise(function (
      resolve,
      reject,
    ) {
      // eslint-disable-next-line prefer-const
      let transactions: TransactionType[] = [];
      fs.createReadStream(csvFilePath)
        .pipe(csv({ from_line: 2 }))
        .on('data', row => {
          console.log(row);
          const data = row;
          console.log(data[0]);
          const transaction = {
            title: data[0],
            type: data[1],
            value: data[2],
            category: data[3],
          };
          transactions.push(transaction);
        })
        .on('end', () => {
          console.log('CSV file sucessfully processed');
          console.log(transactions);
          resolve(transactions);
        })
        .on('error', reject);
    });

    const transactions = await promise;
    const createTx = new CreateTransactionService();
    transactions.forEach(async transaction => {
      await createTx.execute({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: transaction.category,
      });
    });
    return transactions;
  }
}

export default ImportTransactionsService;
