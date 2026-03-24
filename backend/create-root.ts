import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'root@icemecatech.com'; // Modifie ça par ton vrai email
  const password = 'SuperPassword2026!'; // Modifie par ton vrai mot de passe

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Chercher le compte Root existant
  const existingRoot = await prisma.appUser.findFirst({
    where: { role: 'Root' }
  });

  if (existingRoot) {
    console.log(`♻️ Un compte Root a été trouvé (${existingRoot.email}). Mise à jour en cours...`);
    const updated = await prisma.appUser.update({
      where: { id: existingRoot.id },
      data: {
        email: email,
        password: hashedPassword
      }
    });
    console.log(`✅ SuperAdmin mis à jour avec succès ! Tu peux te connecter avec l'email : ${updated.email}`);
    return;
  }

  // 2. Création initiale (si aucun Root n'existait)
  const admin = await prisma.appUser.create({
    data: {
      firstName: 'ICE',
      lastName: 'SuperAdmin',
      email: email,
      password: hashedPassword,
      role: 'Root',
      active: true,
      superAdminPerms: [
        'VIEW_DASHBOARD', 'MANAGE_MODERATION', 'MANAGE_TENANTS',
        'VIEW_TENANTS', 'MANAGE_LEADS', 'MANAGE_CONFIG',
        'VIEW_LOGS', 'MANAGE_SCANS', 'VIEW_MOBILE_USERS'
      ]
    }
  });

  console.log(`✅ SuperAdmin créé avec succès. Utilises : ${admin.email}`);
}

main()
  .catch(e => {
    console.error("❌ Erreur :", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
