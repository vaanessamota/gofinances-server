import { getRepository, getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getRepository(Transaction);
    const customTxRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id;

    if (categoryExists) {
      category_id = categoryExists.id;
    } else {
      const newCategory = categoryRepository.create({ title: category });

      await categoryRepository.save(newCategory);

      category_id = newCategory.id;
    }

    const balance = await customTxRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError(
        'Cant create transaction with an invalid outcome.',
        400,
      );
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
