#!/usr/bin/env node

/**
 * CLI script to seed the database via the API
 * Usage: node seed-cli.js [ginza|osaka|all]
 */

const area = process.argv[2] || 'all';
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

// Determine which worker URL to use
const workerUrl = process.env.WORKER_URL || 'http://localhost:8787';

async function seed() {
  console.log(`🌱 Seeding ${area} area(s)...`);
  console.log(`📍 Worker URL: ${workerUrl}`);

  if (!apiKey) {
    console.error('❌ Error: GOOGLE_PLACES_API_KEY environment variable not set');
    console.log('\nOptions:');
    console.log('1. Set as Wrangler secret (production):');
    console.log('   npx wrangler secret put GOOGLE_PLACES_API_KEY');
    console.log('\n2. Set as environment variable (local):');
    console.log('   export GOOGLE_PLACES_API_KEY=your_key_here');
    console.log('   npm run seed:all');
    console.log('\n3. Add to .dev.vars file (local development):');
    console.log('   echo "GOOGLE_PLACES_API_KEY=your_key_here" >> .dev.vars');
    process.exit(1);
  }

  const areas = area === 'all' ? ['ginza', 'osaka'] : [area];

  try {
    const response = await fetch(`${workerUrl}/api/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        areas,
        apiKey,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Seeding completed successfully!');
      console.log(`\n📊 Results:`);
      console.log(`   Ginza venues: ${data.results.ginza}`);
      console.log(`   Osaka venues: ${data.results.osaka}`);
      console.log(`   Total: ${data.results.total}`);
      console.log(`   Duration: ${data.duration}`);

      if (data.stats) {
        console.log(`\n📈 Database Stats:`);
        console.log(`   Total venues: ${data.stats.total}`);
        console.log(`\n   By category:`);
        data.stats.byCategory.forEach((cat) => {
          console.log(`      ${cat.category}: ${cat.count}`);
        });
        console.log(`\n   By district:`);
        data.stats.byDistrict.forEach((dist) => {
          console.log(`      ${dist.district}: ${dist.count}`);
        });
      }
    } else {
      console.error('❌ Seeding failed:', data.error);
      if (data.message) {
        console.error(`   ${data.message}`);
      }
      if (data.instructions) {
        console.log('\n💡 Instructions:', data.instructions);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the worker is running:');
    console.log('   npx wrangler dev');
    console.log('\nOr set WORKER_URL for production:');
    console.log('   WORKER_URL=https://your-worker.workers.dev npm run seed:all');
    process.exit(1);
  }
}

seed();
