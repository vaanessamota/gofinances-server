import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getRepository(Transaction);

    const txExists = transactionRepository.find({ where: { id } });

    if (!txExists) {
      throw new AppError('This transaction does not exist', 400);
    }

    await transactionRepository.delete({ id });
  }
}

export default DeleteTransactionService;
