const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

async function run() {
  const client = new MongoClient("mongodb://127.0.0.1:27017/");
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbsInfo = await adminDb.listDatabases();
    
    console.log("--- SEARCHING ALL DATABASES FOR USER EMAILS ---");
    const targetEmails = [
      "akselvaprabhu@gmail.com",
      "sec1@gmail.com",
      "akcanteen@gmail.com",
      "abi@gmail.com",
      "superadmin@gmail.com"
    ];

    for (const dbInfo of dbsInfo.databases) {
      const dbName = dbInfo.name;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      for (const colInfo of collections) {
        const colName = colInfo.name;
        // Search in all collections (just in case they are in users, admins, etc.)
        try {
          const matchedDocs = await db.collection(colName).find({
            $or: [
              { email: { $in: targetEmails } },
              { username: { $in: targetEmails } }
            ]
          }).toArray();
          
          if (matchedDocs.length > 0) {
            console.log(`Found matches in DB [${dbName}], collection [${colName}]:`);
            matchedDocs.forEach(doc => {
              console.log(`  - Role: ${doc.role}, Email/Username: ${doc.email || doc.username}, Name: ${doc.name}, Hash: ${doc.password}`);
            });
          }
        } catch (e) {
          // ignore index errors or other collection types
        }
      }
    }
  } catch (err) {
    console.error("Error listing/searching databases:", err);
  } finally {
    await client.close();
  }
}

run().then(() => process.exit(0));
