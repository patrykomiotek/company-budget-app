import 'dotenv/config';
import { PrismaClient } from '../src/lib/generated/prisma/client.js';
import { CategoryType } from '../src/lib/generated/prisma/enums.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const incomeCategories = [
  {
    name: 'Całkowite przychody',
    subcategories: [
      'Wynagrodzenie',
      'Wynagrodzenie Partnera / Partnerki',
      'Premia',
      'Przychody z premii bankowych',
      'Odsetki bankowe',
      'Sprzedaż na Allegro itp.',
      'Inne przychody',
    ],
  },
];

const expenseCategories = [
  {
    name: 'Jedzenie',
    subcategories: [
      'Jedzenie dom i zakupy',
      'Jedzenie miasto',
      'Jedzenie praca',
      'Alkohol',
      'Catering pudełkowy',
      'Jedzenie zamawiane np. z Pyszne',
      'Woda',
      'Suplementy, białka, odżywki',
      'Inne',
    ],
  },
  {
    name: 'Mieszkanie / dom',
    subcategories: [
      'Czynsz',
      'Woda i kanalizacja',
      'Prąd',
      'Gaz',
      'Ogrzewanie',
      'Wywóz śmieci',
      'Konserwacja i naprawy',
      'Wyposażenie',
      'Rata kredytu + ubezpieczenie',
      'Inne',
    ],
  },
  {
    name: 'Transport',
    subcategories: [
      'Paliwo do auta',
      'Przeglądy i naprawy auta',
      'Wyposażenie dodatkowe (opony)',
      'Ubezpieczenie auta',
      'Bilet komunikacji miejskiej',
      'Bilet PKP, PKS',
      'Taxi / Bolt / Uber',
      'Traficar',
      'Inne',
    ],
  },
  {
    name: 'Telekomunikacja',
    subcategories: [
      'Telefon abonament 1',
      'Telefon sprzęt i akcesoria',
      'TV',
      'Internet abonament',
      'Abonamenty różne',
      'Sprzęt',
      'Inne',
    ],
  },
  {
    name: 'Zdrowie',
    subcategories: [
      'Lekarz / wizyta lekarska',
      'Badania np. krwi',
      'Lekarstwa',
      'Dentysta',
      'Ubezpieczenie zdrow. Luxmed',
      'Psychoterapia',
      'Trener personalny',
      'Siłownia',
      'Inne',
    ],
  },
  {
    name: 'Ubranie',
    subcategories: [
      'Ubranie zwykłe',
      'Ubranie sportowe',
      'Buty',
      'Dodatki',
      'Inne',
    ],
  },
  {
    name: 'Higiena',
    subcategories: [
      'Kosmetyki',
      'Środki czystości (chemia)',
      'Środki do mycia / szampony itd',
      'Fryzjer',
      'Kosmetyczka',
      'Zabiegi',
      'Inne',
    ],
  },
  {
    name: 'Koty / dzieci i inni podopieczni',
    subcategories: [
      'Karma sucha',
      'Karma mokra',
      'Mięso',
      'Weterynarz',
      'Żwirek',
      'Opieka nad kotem',
      'Suple i witaminy',
      'Inne',
    ],
  },
  {
    name: 'Rozrywka',
    subcategories: [
      'Basen',
      'Kino / Teatr',
      'Koncerty',
      'Czasopisma',
      'Książki',
      'Hobby',
      'Hotel / Turystyka',
      'Inne',
    ],
  },
  {
    name: 'Inne wydatki',
    subcategories: [
      'Dobroczynność',
      'Prezenty',
      'Sprzęt RTV',
      'Oprogramowanie',
      'Edukacja / Szkolenia',
      'Usługi inne',
      'Podatki',
      'Pamiątki',
      'Inne',
    ],
  },
  {
    name: 'Spłata długów',
    subcategories: [
      'Kredyt hipoteczny',
      'Kredyt konsumpcyjny',
      'Pożyczka osobista',
      'Inne',
    ],
  },
  {
    name: 'Budowanie oszczędności',
    subcategories: [
      'Fundusz awaryjny',
      'Fundusz wydatków nieregularnych',
      'Poduszka finansowa',
      'Konto emerytalne IKE/IKZE',
      'Nadpłata długów',
      'Fundusz: wakacje',
      'Fundusz: prezenty świąteczne',
      'Inne',
    ],
  },
  {
    name: 'Podróże i wyjazdy po Polsce',
    subcategories: [
      'Noclegi',
      'Loty',
      'Pociąg',
      'Samochód',
      'Transport na miejscu',
      'Zakupy spożywcze',
      'Jedzenie na mieście',
      'Zwiedzanie',
      'Atrakcje',
      'Zakupy przed podróżą / ubezpieczenia',
    ],
  },
  {
    name: 'Urlopy zagraniczne',
    subcategories: [
      'Noclegi',
      'Loty',
      'Pociąg',
      'Samochód',
      'Transport na miejscu',
      'Zakupy spożywcze',
      'Jedzenie na mieście',
      'Zwiedzanie / wypoczynek',
      'Zakupy przed podróżą / ubezpieczenia',
    ],
  },
  {
    name: 'Inne',
    subcategories: ['Inne'],
  },
];

async function main() {
  console.log('Seeding categories...');

  for (let i = 0; i < incomeCategories.length; i++) {
    const cat = incomeCategories[i];
    const category = await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: CategoryType.INCOME } },
      update: {},
      create: {
        name: cat.name,
        type: CategoryType.INCOME,
        sortOrder: i,
      },
    });

    for (let j = 0; j < cat.subcategories.length; j++) {
      await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: cat.subcategories[j],
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          name: cat.subcategories[j],
          categoryId: category.id,
          sortOrder: j,
        },
      });
    }
  }

  for (let i = 0; i < expenseCategories.length; i++) {
    const cat = expenseCategories[i];
    const category = await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: CategoryType.EXPENSE } },
      update: {},
      create: {
        name: cat.name,
        type: CategoryType.EXPENSE,
        sortOrder: i,
      },
    });

    for (let j = 0; j < cat.subcategories.length; j++) {
      await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: cat.subcategories[j],
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          name: cat.subcategories[j],
          categoryId: category.id,
          sortOrder: j,
        },
      });
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
