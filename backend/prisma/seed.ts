import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adatbázis magvetése (seeding) megkezdődött...');

  // 1. Meglévő adatok törlése (fordított függőségi sorrendben)
  await prisma.auditLog.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.training.deleteMany();
  await prisma.cupTeamMember.deleteMany();
  await prisma.cupTeam.deleteMany();
  await prisma.cupResult.deleteMany();
  await prisma.cupSchedule.deleteMany();
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

  // 3. Edzések létrehozása (default 20 hely, különböző helyszínekkel, időrendben)
  const training1 = await prisma.training.create({
    data: {
      title: 'BME Sportközpont Edzés - Hétfő',
      description: 'Technikai és taktikai játék a hét indításaként.',
      location: 'BME Sportközpont',
      address: '1111 Budapest, Bertalan Lajos u. 4-6.',
      date: new Date('2026-11-02T18:00:00Z'),
      startTime: '18:00',
      endTime: '20:00',
      maxParticipants: 20,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  const training2 = await prisma.training.create({
    data: {
      title: 'Óbudai Edzés - Kedd',
      description: 'Pörgős meccsezés a Doberdó úti Kollégium tornatermében.',
      location: 'Óbudai Egyetem - Doberdó úti Kollégium tornaterem',
      address: '1034 Budapest, Doberdó út 6.',
      date: new Date('2026-11-03T17:00:00Z'),
      startTime: '17:00',
      endTime: '19:00',
      maxParticipants: 20,
      type: 'MECCS',
      createdBy: admin.id,
    },
  });

  const training3 = await prisma.training.create({
    data: {
      title: 'Bercsényi Edzés - Szerda',
      description: 'Közös játék a Bercsényi Kollégium tornatermében.',
      location: 'Bercsényi Kollégium tornaterem',
      address: '1117 Budapest, Bercsényi u. 28-30.',
      date: new Date('2026-11-04T19:00:00Z'),
      startTime: '19:00',
      endTime: '21:00',
      maxParticipants: 20,
      type: 'SZABAD_EDZÉS',
      createdBy: admin.id,
    },
  });

  const training4 = await prisma.training.create({
    data: {
      title: 'Kármán Edzés - Csütörtök',
      description: 'Edzés és jókedv a Kármán Kollégium tornatermében.',
      location: 'Kármán Tódor Kollégium tornaterem',
      address: '1111 Budapest, Kruspér u. 2-4.',
      date: new Date('2026-11-05T18:30:00Z'),
      startTime: '18:30',
      endTime: '20:30',
      maxParticipants: 20,
      type: 'GYAKORLÁS',
      createdBy: admin.id,
    },
  });

  const training5 = await prisma.training.create({
    data: {
      title: 'BME Sporttelep Strandröpi - Szombat',
      description: 'Strandröplabda edzés a BME Sporttelepen, homokon.',
      location: 'BME Sporttelep - Strandröplabda pálya',
      address: '1111 Budapest, Bogdánfy Ödön u. 10.',
      date: new Date('2026-11-07T10:00:00Z'),
      startTime: '10:00',
      endTime: '12:00',
      maxParticipants: 20,
      type: 'SZABAD_EDZÉS',
      createdBy: admin.id,
    },
  });

  const training6 = await prisma.training.create({
    data: {
      title: 'BME Sportközpont Mini Bajnokság - Vasárnap',
      description: 'Kupára felkészítő meccsek a Sportközpontban.',
      location: 'BME Sportközpont',
      address: '1111 Budapest, Bertalan Lajos u. 4-6.',
      date: new Date('2026-11-08T15:00:00Z'),
      startTime: '15:00',
      endTime: '18:00',
      maxParticipants: 20,
      type: 'MECCS',
      createdBy: admin.id,
    },
  });

  console.log(`✅ 6 edzés létrehozva.`);

  // 4. Jelentkezések rögzítése
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

  console.log(`✅ Jelentkezések rögzítve.`);

  // 5. Röpikupa csapatok (Kizárólag Vegyes kategóriában, játékos attribútumokkal)
  const team1 = await prisma.cupTeam.create({
    data: {
      teamName: 'Villany Ászok',
      captainName: 'Kovács Péter',
      captainEmail: 'kovacs.peter@ropikor.hu',
      captainUserId: admin.id,
      memberCount: 6,
      category: 'Pro',
      cupEdition: 'IV. VRK 2026',
      acceptedRules: true,
      status: 'CONFIRMED',
      members: {
        create: [
          { name: 'Kovács Péter', isVik: true, isBme: true, isFemale: false },
          { name: 'Nagy Anna', isVik: true, isBme: true, isFemale: true },
          { name: 'Kiss Bence', isVik: true, isBme: true, isFemale: false },
          { name: 'Szabó Eszter', isVik: false, isBme: true, isFemale: true },
          { name: 'Horváth Márk', isVik: true, isBme: true, isFemale: false },
          { name: 'Tóth Zsófia', isVik: false, isBme: false, isFemale: true },
        ],
      },
    },
  });

  const team2 = await prisma.cupTeam.create({
    data: {
      teamName: 'Schönherz Sáncolók',
      captainName: 'Balogh Tamás',
      captainEmail: 'tamas@ropikor.hu',
      memberCount: 6,
      category: 'Casual',
      cupEdition: 'IV. VRK 2026',
      acceptedRules: true,
      status: 'SUBMITTED',
      members: {
        create: [
          { name: 'Balogh Tamás', isVik: true, isBme: true, isFemale: false },
          { name: 'Kerekes Luca', isVik: true, isBme: true, isFemale: true },
          { name: 'Varga Dániel', isVik: true, isBme: true, isFemale: false },
          { name: 'Molnár Gábor', isVik: true, isBme: true, isFemale: false },
          { name: 'Farkas Lili', isVik: false, isBme: true, isFemale: true },
          { name: 'Papp Balázs', isVik: false, isBme: false, isFemale: false },
        ],
      },
    },
  });

  const team3 = await prisma.cupTeam.create({
    data: {
      teamName: 'Mixed Signals',
      captainName: 'Takács Dóra',
      captainEmail: 'dora@ropikor.hu',
      memberCount: 6,
      category: 'Pro',
      cupEdition: 'V. VRK 2027',
      acceptedRules: true,
      status: 'SUBMITTED',
      members: {
        create: [
          { name: 'Takács Dóra', isVik: true, isBme: true, isFemale: true },
          { name: 'Bíró László', isVik: true, isBme: true, isFemale: false },
          { name: 'Oláh Boglárka', isVik: true, isBme: true, isFemale: true },
          { name: 'Gál Marcell', isVik: false, isBme: true, isFemale: false },
          { name: 'Simon Vivien', isVik: false, isBme: false, isFemale: true },
          { name: 'Németh Tamás', isVik: true, isBme: true, isFemale: false },
        ],
      },
    },
  });

  console.log(`✅ 3 kupa csapat létrehozva (kizárólag Vegyes kategória).`);

  // 6. Korábbi kupa eredmények (Kizárólag Vegyes kategória)
  await prisma.cupResult.createMany({
    data: [
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'VEGYES',
        placement: 1,
        teamName: 'BME VIK Röpi Kör',
        notes: 'Aranyérem, veretlen menetelés a tornán',
      },
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'VEGYES',
        placement: 2,
        teamName: 'Dirac Delta Spike',
        notes: 'Ezüstérem',
      },
      {
        cupEdition: 'I. VRK 2023',
        year: 2023,
        category: 'VEGYES',
        placement: 3,
        teamName: 'Villámcsapás',
        notes: 'Bronzérem',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'VEGYES',
        placement: 1,
        teamName: 'Dirac Delta Spike',
        notes: 'Bajnok csapat',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'VEGYES',
        placement: 2,
        teamName: 'Villany Ászok',
        notes: 'Második helyezett',
      },
      {
        cupEdition: 'II. VRK 2024',
        year: 2024,
        category: 'VEGYES',
        placement: 3,
        teamName: 'LabView Legends',
        notes: 'Harmadik helyezett',
      },
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
        teamName: 'Schönherz Sáncolók',
        notes: 'Vegyes torna ezüstérmese',
      },
      {
        cupEdition: 'III. VRK 2025',
        year: 2025,
        category: 'VEGYES',
        placement: 3,
        teamName: 'Villámcsapás',
        notes: 'Vegyes torna bronzérmese',
      },
    ],
  });

  console.log(`✅ Korábbi kupa eredmények sikeresen rögzítve (kizárólag Vegyes).`);

  // 7. Kupa lebonyolítás táblázat alapértelmezett bejegyzés
  const sampleScheduleCsv = `Időpont,Pálya,A csapat,B csapat,Kategória,Játékvezetők\n09:00,1. pálya,Villany Ászok,Schönherz Sáncolók,Vegyes,Röpi Kör bírók\n10:00,1. pálya,Mixed Signals,Infó Blokk,Vegyes,Röpi Kör bírók\n11:30,1. pálya,Elődöntő 1,Elődöntő 2,Vegyes,Röpi Kör bírók\n13:00,1. pálya,Döntő A,Döntő B,Vegyes,Röpi Kör bírók`;
  await prisma.cupSchedule.create({
    data: {
      fileName: 'IV_VRK_2026_lebonyolitas_tablazat.csv',
      fileData: Buffer.from(sampleScheduleCsv).toString('base64'),
      mimeType: 'text/csv',
    },
  });
  console.log(`✅ Alapértelmezett lebonyolítási táblázat beállítva.`);

  // 8. Kapcsolatfelvételi tesztüzenetek
  await prisma.message.createMany({
    data: [
      {
        senderName: 'Horváth Lili',
        senderEmail: 'lili.horvath@example.com',
        subject: 'Csatlakozási lehetőség',
        body: 'Szia! Nagyon tetszik a közösségetek, mikor tudnék lemenni az első edzésetekre?',
        isRead: false,
      },
      {
        senderName: 'Varga Márk',
        senderEmail: 'mark.varga@example.com',
        subject: 'Ötlet új edzésidőpontra',
        body: 'Szerintem szuper lenne vasárnap esténként is egy szabad játék edzés.',
        isRead: true,
      },
    ],
  });

  // 9. Kezdeti audit napló
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'INITIAL_SEED_COMPLETED',
      details: 'A rendszer frissítve a legújabb specifikációknak és követelményeknek megfelelően.',
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
