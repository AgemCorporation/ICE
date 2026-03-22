const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanDuplicates() {
  console.log('Finding duplicate emails...');
  const client = await pool.connect();
  
  try {
    const { rows: allClients } = await client.query('SELECT id, email FROM "Client"');
    
    const emailMap = new Map();
    const idsToDelete = [];

    for (const c of allClients) {
      if (c.email) {
        if (emailMap.has(c.email)) {
          console.log(`Duplicate found for ${c.email}: Deleting ${c.id}`);
          idsToDelete.push(c.id);
        } else {
          emailMap.set(c.email, c.id);
        }
      }
    }

    console.log(`Found ${idsToDelete.length} duplicates to delete.`);
    
    if (idsToDelete.length > 0) {
       // Delete related invoices first
       for (const id of idsToDelete) {
         await client.query('DELETE FROM "InvoiceItem" WHERE "invoiceId" IN (SELECT id FROM "Invoice" WHERE "clientId" = $1)', [id]);
         await client.query('DELETE FROM "Invoice" WHERE "clientId" = $1', [id]);
         await client.query('DELETE FROM "Client" WHERE id = $1', [id]);
       }
       console.log(`Successfully deleted ${idsToDelete.length} duplicate clients.`);
    } else {
      console.log('No duplicates found.');
    }
  } finally {
    client.release();
  }
}

cleanDuplicates()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
