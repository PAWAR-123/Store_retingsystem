const bcrypt = require('bcryptjs');
const { initializeDatabase } = require('./db');
const { defineModels } = require('./models');

async function seed() {
  console.log('🌱 Starting database seeding process...');
  
  try {
    const sequelize = await initializeDatabase();
    const { User, Store, Rating } = defineModels(sequelize);
    
    // Sync models to database
    console.log('🔄 Syncing models (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ Models synced.');

    // Helper to hash passwords
    const hashPassword = async (pwd) => {
      return await bcrypt.hash(pwd, 10);
    };

    console.log('👤 Seeding users...');
    
    // Admin User
    const adminPassword = await hashPassword('Admin123!');
    const admin = await User.create({
      name: 'Alexander Maximilian Romanov', // 28 chars
      email: 'admin@storerating.com',
      password: adminPassword,
      address: '100 Administration Parkway, Tech Plaza, Suite 900, Silicon Valley',
      role: 'admin'
    });

    // Normal User 1
    const user1Password = await hashPassword('User1234!');
    const user1 = await User.create({
      name: 'Isabella Francesca Sterling', // 28 chars
      email: 'isabella.sterling@example.com',
      password: user1Password,
      address: '742 Evergreen Terrace, Springfield, OR 97477, United States',
      role: 'user'
    });

    // Normal User 2
    const user2Password = await hashPassword('User1234!');
    const user2 = await User.create({
      name: 'Jonathan Christopher Vance', // 27 chars
      email: 'jonathan.vance@example.com',
      password: user2Password,
      address: '221B Baker Street, London, NW1 6XE, United Kingdom',
      role: 'user'
    });

    // Store Owner 1
    const owner1Password = await hashPassword('Owner123!');
    const owner1 = await User.create({
      name: 'Leonardo Di Ser Piero Da Vinci', // 30 chars
      email: 'owner1@gourmetgarden.com',
      password: owner1Password,
      address: '456 Culinary Boulevard, Suite A, Downtown Metropolis',
      role: 'store_owner'
    });

    // Store Owner 2
    const owner2Password = await hashPassword('Owner123!');
    const owner2 = await User.create({
      name: 'Victoria Elizabeth Windsor', // 27 chars
      email: 'owner2@royaltea.com',
      password: owner2Password,
      address: 'Buckingham Palace Road, London, SW1A 1AA, United Kingdom',
      role: 'store_owner'
    });

    console.log('🏪 Seeding stores...');
    
    // Store 1
    const store1 = await Store.create({
      name: 'Gourmet Garden Bistro Lounge', // 28 chars
      email: 'owner1@gourmetgarden.com',
      address: '456 Culinary Boulevard, Suite A, Downtown Metropolis',
      ownerId: owner1.id
    });

    // Store 2
    const store2 = await Store.create({
      name: 'Royal Tea Room & Patisserie', // 28 chars
      email: 'owner2@royaltea.com',
      address: 'Buckingham Palace Road, London, SW1A 1AA, United Kingdom',
      ownerId: owner2.id
    });

    console.log('⭐ Seeding ratings...');
    
    // Ratings for Store 1
    await Rating.create({
      userId: user1.id,
      storeId: store1.id,
      rating: 5
    });

    await Rating.create({
      userId: user2.id,
      storeId: store1.id,
      rating: 4
    });

    // Ratings for Store 2
    await Rating.create({
      userId: user1.id,
      storeId: store2.id,
      rating: 4
    });

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
