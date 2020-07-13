import csv from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  csvFilePath: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFilePath }: Request): Promise<Transaction[]> {
    const readStream = fs.createReadStream(csvFilePath);

    const parsers = csv({
      from_line: 2,
    });

    const parseCSV = readStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async row => {
      const [title, type, value, category] = row.map((cell: string) =>
        cell.trim(),
      );

      // if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);
    console.log(categories);
    console.log(transactions);

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createTransactions);

    await fs.promises.unlink(csvFilePath); // excluir arquivo após operações

    return createTransactions;
  }
}

export default ImportTransactionsService;
