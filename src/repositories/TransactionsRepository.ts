import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    let income = 0;
    let outcome = 0;

    const transactionsRepository = getRepository(Transaction);

    const incomeTransactions = await transactionsRepository.find({
      where: { type: 'income' },
    });

    incomeTransactions.forEach(transaction => {
      income += transaction.value;
    });

    const outcomeTransactions = await transactionsRepository.find({
      where: { type: 'outcome' },
    });

    outcomeTransactions.forEach(transaction => {
      outcome += transaction.value;
    });

    const total = income - outcome;

    const balance = { income, outcome, total };

    return balance;
  }
}

export default TransactionsRepository;
