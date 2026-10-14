import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adatbázis magvetése (seeding) megkezdődött...');

  // 1. Meglévő adatok törlése (fordított függőségi sorrendben)
  await prisma.auditLog.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.training.deleteMany();
  await prisma.cupTeam.deleteMany();
  await prisma.cupResult.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Korábbi adatok sikeresen törölve.');

  // 2. Felhasználók létrehozása
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ropikor.hu',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Kovács Péter',
      isActiveMember: true,
      position: 'feladó',
      neptunCode: 'ADMIN1',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'felhasznalo1@edu.bme.hu',
      password: userPassword,
      role: 'USER',
      name: 'Nagy Anna',
      neptunCode: 'QTLYQ6',
      isActiveMember: true,
      position: 'center',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'felhasznalo2@edu.bme.hu',
      password: userPassword,
      role: 'USER',
      name: 'Kiss Bence',
      neptunCode: 'ABC123',
      isActiveMember: true,
      position: 'ütő',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'felhasznalo3@edu.bme.hu',
      password: userPassword,
      role: 'USER',
      name: 'Szabó Eszter',
      neptunCode: 'DEF456',
      isActiveMember: false,
      position: null,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'felhasznalo4@edu.bme.hu',
      password: userPassword,
      role: 'USER',
      name: 'Tóth Dávid',
      neptunCode: 'GHI789',
      isActiveMember: true,
      position: 'libero',
    },
  });

  console.log(`✅ 5 felhasználó sikeresen létrehozva.`);

  // 3. Edzések létrehozása (5-6 db közelgő edzés)
  const training1 = await prisma.training.create({
    data: {
      title: 'BME Edzés - Hétfő',
      description: 'Alapozó technikai és taktikai edzés a hét indításaként.',
      location: 'BME',
      address: 'BME Q épület',
      date: new Date('2026-10-20T18:00:00Z'),
      startTime: '18:00',
      endTime: '20:00',
      maxParticipants: 12,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  const training2 = await prisma.training.create({
    data: {
      title: 'BME Edzés - Szerda',
      description: 'Támadásépítés, feladás-ütés összhang és blokk-védekezés.',
      location: 'BME',
      address: 'BME Q épület',
      date: new Date('2026-10-22T18:00:00Z'),
      startTime: '18:00',
      endTime: '20:00',
      maxParticipants: 12,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  const training3 = await prisma.training.create({
    data: {
      title: 'Óbudai Edzés - Kedd',
      description: 'Gyakorló edzés az Óbudai Egyetem sportcsarnokában.',
      location: 'ÓBUDAI',
      address: 'Óbudai Egyetem',
      date: new Date('2026-10-21T17:00:00Z'),
      startTime: '17:00',
      endTime: '19:00',
      maxParticipants: 10,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  const training4 = await prisma.training.create({
    data: {
      title: 'Strand Röplabda - Szombat',
      description: 'Szabadtéri strandröplabda edzés a Lupa beachen, jó idő esetén.',
      location: 'STRAND',
      address: 'Lupa Beach',
      date: new Date('2026-10-25T10:00:00Z'),
      startTime: '10:00',
      endTime: '12:00',
      maxParticipants: 8,
      type: 'SZABAD_EDZÉS',
      createdBy: admin.id,
    },
  });

  const training5 = await prisma.training.create({
    data: {
      title: 'BME Mini Meccs - Péntek',
      description: 'Edzőmérkőzés 3 nyert szettre a kör tagjai és meghívott vendégek között.',
      location: 'BME',
      address: 'BME Q épület',
      date: new Date('2026-10-24T19:00:00Z'),
      startTime: '19:00',
      endTime: '21:00',
      maxParticipants: 14,
      type: 'MECCS',
      createdBy: admin.id,
    },
  });

  const training6 = await prisma.training.create({
    data: {
      title: 'Betelt edzés',
      description: 'Kiscsoportos feladó-ütő tréning, limitált 2 fős létszámmal (tesztelésre).',
      location: 'BME',
      address: 'BME Q épület',
      date: new Date('2026-10-23T18:00:00Z'),
      startTime: '18:00',
      endTime: '20:00',
      maxParticipants: 2,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  console.log(`✅ 6 edzés sikeresen létrehozva.`);

  // 4. Jelentkezések (teszteléshez és EF-2 funkcióhoz)
  // Training 1: User1 ACCEPTED, User2 ACCEPTED
  await prisma.registration.create({
    data: {
      trainingId: training1.id,
      userId: user1.id,
      status: 'ACCEPTED',
      position: 1,
    },
  });

  await prisma.registration.create({
    data: {
      trainingId: training1.id,
      userId: user2.id,
      status: 'ACCEPTED',
      position: 2,
    },
  });

  // Training 6 (betelt, max 2): User1 ACCEPTED, User2 ACCEPTED, User3 WAITLISTED
  await prisma.registration.create({
    data: {
      trainingId: training6.id,
      userId: user1.id,
      status: 'ACCEPTED',
      position: 1,
    },
  });

  await prisma.registration.create({
    data: {
      trainingId: training6.id,
      userId: user2.id,
      status: 'ACCEPTED',
      position: 2,
    },
  });

  await prisma.registration.create({
    data: {
      trainingId: training6.id,
      userId: user3.id,
      status: 'WAITLISTED',
      position: 3,
    },
  });

  console.log(`✅ Jelentkezések rögzítve (beleértve a betelt edzés várólistáját).`);

  // 5. Röpikupa csapatok (CupTeam)
  await prisma.cupTeam.createMany({
    data: [
      {
        teamName: 'Röpi Királyok',
        captainName: 'Horváth Ádám',
        captainEmail: 'adam@ropikor.hu',
        memberCount: 6,
        category: 'FÉRFI',
        cupEdition: 'IV. VRK 2026',
        acceptedRules: true,
        status: 'SUBMITTED',
      },
      {
        teamName: 'Spike Girls',
        captainName: 'Kovács Dóra',
        captainEmail: 'dora@ropikor.hu',
        memberCount: 6,
        category: 'NŐI',
        cupEdition: 'IV. VRK 2026',
        acceptedRules: true,
        status: 'CONFIRMED',
      },
      {
        teamName: 'Villámcsapás',
        captainName: 'Balogh Tamás',
        captainEmail: 'tamas@ropikor.hu',
        memberCount: 8,
        category: 'VEGYES',
        cupEdition: 'IV. VRK 2026',
        acceptedRules: true,
        status: 'SUBMITTED',
      },
    ],
  });

  console.log(`✅ 3 kupa csapat regisztrálva.`);

  // 6. Korábbi kupa eredmények (CupResult)
  await prisma.cupResult.createMany({
    data: [
      // I. VRK 2023 - Férfi
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'FÉRFI',
        placement: 1,
        teamName: 'Röpi Kör',
        notes: 'Aranyérem, veretlen menetelés',
      },
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'FÉRFI',
        placement: 2,
        teamName: 'Dirac Delta Spike',
        notes: 'Ezüstérem',
      },
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'FÉRFI',
        placement: 3,
        teamName: 'Villámcsapás',
        notes: 'Bronzérem',
      },

      // II. VRK 2024 - Férfi
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'FÉRFI',
        placement: 1,
        teamName: 'Dirac Delta Spike',
        notes: 'Bajnok',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'FÉRFI',
        placement: 2,
        teamName: 'Röpi Kör',
        notes: 'Második helyezett',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'FÉRFI',
        placement: 3,
        teamName: 'LabView Legends',
        notes: 'Harmadik helyezett',
      },

      // II. VRK 2024 - Női
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'NŐI',
        placement: 1,
        teamName: 'Spike Girls',
        notes: 'Női kategória győztes',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'NŐI',
        placement: 2,
        teamName: 'Net Ninjas',
        notes: 'Női kategória 2. hely',
      },

      // III. VRK 2025 - Férfi Selejtező és Döntő
      {
        cupEdition: 'III. VRK 2025',
        year: 2025,
        category: 'FÉRFI',
        placement: 1,
        teamName: 'Dirac Delta Spike',
        notes: 'Döntő győztes',
      },
      {
        cupEdition: 'III. VRK 2025',
        year: 2025,
        category: 'FÉRFI',
        placement: 2,
        teamName: 'Röpi Kör',
        notes: 'Selejtező 1. hely, döntő 2. hely',
      },

      // III. VRK 2025 - Vegyes
      {
        cupEdition: 'III. VRK 2025',
        year: 2025,
        category: 'VEGYES',
        placement: 1,
        teamName: 'Mixed Signals',
        notes: 'Vegyes torna aranyérmese',
      },
      {
        cupEdition: 'III. VRK 2025',
        year: 2025,
        category: 'VEGYES',
        placement: 2,
        teamName: 'Villámcsapás',
        notes: 'Vegyes torna ezüstérmese',
      },
    ],
  });

  console.log(`✅ Korábbi kupa eredmények sikeresen rögzítve.`);

  // 7. Kapcsolatfelvételi üzenetek (Message)
  await prisma.message.createMany({
    data: [
      {
        senderName: 'Horváth Lili',
        senderEmail: 'lili.horvath@example.com',
        subject: 'Csatlakozás',
        body: 'Szia! Szeretnék csatlakozni a röplabda körhöz. Mikor van a következő nyílt edzés?',
        isRead: false,
      },
      {
        senderName: 'Varga Márk',
        senderEmail: 'mark.varga@example.com',
        subject: 'Terem bérlés',
        body: 'Lehetne-e extra edzést szervezni szombat délelőttre?',
        isRead: true,
      },
    ],
  });

  console.log(`✅ Kapcsolatfelvételi tesztüzenetek létrehozva.`);

  // 8. Kezdeti audit napló
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'INITIAL_SEED_COMPLETED',
      details: 'A rendszer sikeresen inicializálva a kiindulási tesztadatokkal.',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('🎉 Seeding sikeresen befejeződött!');
}

main()
  .catch((e) => {
    console.error('Hiba a magvetés során:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
