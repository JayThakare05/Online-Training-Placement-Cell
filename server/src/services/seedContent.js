import dotenv from 'dotenv';
import { connectMongoDB } from '../config/db.js';
import Content from '../models/Content.js';

dotenv.config();

const seedContent = async () => {
  try {
    await connectMongoDB();
    console.log('🌱 Starting content seeding...');

    // Clear existing content (optional - remove this if you don't want to clear)
    // await Content.deleteMany({});
    // console.log('🗑️  Cleared existing content');

    // Create a dummy admin user ID (replace with actual admin ID)
    const adminUserId = '66f1234567890abcdef12345'; // Replace with real admin ID

    // Create main folders
    const programmingFolder = new Content({
      title: 'Programming',
      type: 'folder',
      category: 'Technical Skills',
      description: 'Programming languages and concepts',
      created_by: adminUserId
    });
    await programmingFolder.save();

    const interviewPrepFolder = new Content({
      title: 'Interview Prep',
      type: 'folder',
      category: 'Career Skills',
      description: 'Interview preparation materials',
      created_by: adminUserId
    });
    await interviewPrepFolder.save();

    const careerSkillsFolder = new Content({
      title: 'Career Skills',
      type: 'folder',
      category: 'Soft Skills',
      description: 'Professional development and soft skills',
      created_by: adminUserId
    });
    await careerSkillsFolder.save();

    // Create subfolders under Programming
    const jsFolder = new Content({
      title: 'JavaScript',
      type: 'folder',
      category: 'Programming Languages',
      description: 'JavaScript tutorials and exercises',
      parent_id: programmingFolder._id,
      created_by: adminUserId
    });
    await jsFolder.save();

    const pythonFolder = new Content({
      title: 'Python',
      type: 'folder',
      category: 'Programming Languages',
      description: 'Python tutorials and exercises',
      parent_id: programmingFolder._id,
      created_by: adminUserId
    });
    await pythonFolder.save();

    const dsaFolder = new Content({
      title: 'Data Structures & Algorithms',
      type: 'folder',
      category: 'Computer Science',
      description: 'DSA concepts and problems',
      parent_id: programmingFolder._id,
      created_by: adminUserId
    });
    await dsaFolder.save();

    // Create sample content under JavaScript folder
    const jsBasics = new Content({
      title: 'JavaScript Fundamentals',
      type: 'video',
      category: 'Programming Languages',
      description: 'Learn the basics of JavaScript programming',
      parent_id: jsFolder._id,
      duration: '2 hours',
      file_url: 'https://example.com/js-fundamentals',
      status: 'published',
      enrollments: 156,
      created_by: adminUserId
    });
    await jsBasics.save();

    const jsQuiz = new Content({
      title: 'JavaScript Basics Quiz',
      type: 'quiz',
      category: 'Programming Languages',
      description: 'Test your JavaScript knowledge',
      parent_id: jsFolder._id,
      duration: '30 minutes',
      status: 'published',
      enrollments: 89,
      created_by: adminUserId
    });
    await jsQuiz.save();

    // Create content under Interview Prep
    const resumeGuide = new Content({
      title: 'Resume Writing Guide',
      type: 'document',
      category: 'Career Skills',
      description: 'Complete guide to writing an effective resume',
      parent_id: interviewPrepFolder._id,
      duration: '45 min read',
      file_url: 'https://example.com/resume-guide.pdf',
      status: 'published',
      enrollments: 234,
      created_by: adminUserId
    });
    await resumeGuide.save();

    const mockInterview = new Content({
      title: 'Mock Technical Interview',
      type: 'interactive',
      category: 'Interview Practice',
      description: 'Practice technical interviews with AI',
      parent_id: interviewPrepFolder._id,
      duration: '1 hour',
      status: 'published',
      enrollments: 67,
      created_by: adminUserId
    });
    await mockInterview.save();

    console.log('✅ Content seeding completed!');
    console.log(`📁 Created folders: Programming, Interview Prep, Career Skills`);
    console.log(`📂 Created subfolders: JavaScript, Python, DSA`);
    console.log(`📄 Created sample content items`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  }
};

// Run the seeding
seedContent();