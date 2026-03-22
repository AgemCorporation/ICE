import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const req = {
         id: "8c79c882-ab06-4443-85e3-cd56c28f644d",
         date: new Date().toISOString(),
         status: 'NEW',
         motoristName: 'Test Client',
         motoristPhone: '0102030405',
         locationCity: 'Abidjan',
         locationCommune: 'Cocody',
         locationCoords: { lat: 5.3, lng: -4.0 },
         vehicleBrand: 'Peugeot',
         vehicleModel: '208',
         vehicleYear: 2020,
         vehiclePlate: '1234AB01',
         fuel: 'Essence',
         vehicleVin: 'VF3123456789',
         mileage: 50000,
         photos: ['data:image/png;base64,iVBOR...'],
         description: 'Bruit bizarre au freinage\n[Diagnostic: Moteur broute]',
         interventionDate: '2026-03-15',
         interventionLocation: 'GARAGE',
         preferredPeriod: 'ThisWeek',
         interventionType: 'Mécanique',
         preferredDate: '2026-03-14',
         preferredSlot: 'MATIN',
         proposedQuotes: [],
         assignedTenantIds: [],
         diagnosticHistory: [{ question: 'Bruit?', answer: 'Oui' }]
  };

  try {
    const res = await prisma.quoteRequest.create({ data: req });
    console.log("Success:", res.id);
  } catch (err: any) {
    console.error("Prisma error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
