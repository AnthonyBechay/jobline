import { prisma } from '../index';

async function updateExistingCancellationSettings() {
  console.log('🔧 Updating existing cancellation settings with proper names...');

  try {
    // Get all cancellation settings
    const settings = await prisma.cancellationSetting.findMany();
    
    console.log(`Found ${settings.length} cancellation settings to update`);

    for (const setting of settings) {
      // Only update if name is missing
      if (!setting.name) {
        let name: string;
        
        switch (setting.cancellationType) {
          case 'pre_arrival':
          case 'pre_arrival_client':
            name = 'Pre-Arrival Client Cancellation';
            break;
          case 'pre_arrival_candidate':
            name = 'Pre-Arrival Candidate Cancellation';
            break;
          case 'post_arrival_within_3_months':
            name = 'Post-Arrival Within 3 Months';
            break;
          case 'post_arrival_after_3_months':
            name = 'Post-Arrival After 3 Months';
            break;
          case 'candidate_cancellation':
            name = 'Candidate Cancellation';
            break;
          default:
            name = setting.cancellationType;
        }

        await prisma.cancellationSetting.update({
          where: { id: setting.id },
          data: { name }
        });

        console.log(`✅ Updated ${setting.cancellationType} with name: ${name}`);
      }
    }

    console.log('✅ All cancellation settings updated successfully');
  } catch (error) {
    console.error('❌ Error updating cancellation settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  updateExistingCancellationSettings()
    .then(() => {
      console.log('Update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}

export { updateExistingCancellationSettings };
