/**
 * Seed script for TaskBoard database
 * 
 * This script creates:
 * - 3 users (mihail@abv.bg, Ivan@abv.bg, pesho@abv.bg)
 * - 2 projects per user (6 total)
 * - 3 stages per project (Not Started, In Progress, Done)
 * - 10 tasks per project (60 total) distributed across stages
 * 
 * Run with: node supabase/seed.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lrwsyrsjsshnulbhznax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyd3N5cnNqc3NobnVsYmh6bmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDk1MzAsImV4cCI6MjA4Njk4NTUzMH0.zrh-NL7gKDNzg1Y9dicyX1NBa0HPVdMtEwpSh5u0BuU';

// Sample data configuration
const USERS = [
  { email: 'mihail@abv.bg', password: 'password123' },
  { email: 'Ivan@abv.bg', password: 'password123' },
  { email: 'pesho@abv.bg', password: 'password123' }
];

const STAGES = [
  { title: 'Not Started', position: 0 },
  { title: 'In Progress', position: 1 },
  { title: 'Done', position: 2 }
];

const PROJECT_TEMPLATES = [
  {
    title: 'Website Redesign',
    project: 'WEB-REDESIGN',
    description: 'Complete redesign of company website with modern UI/UX'
  },
  {
    title: 'Mobile App Development',
    project: 'MOBILE-APP',
    description: 'Native mobile application for iOS and Android platforms'
  }
];

const TASK_TEMPLATES = [
  { title: 'Research competitor websites', description_html: '<p>Analyze top 5 competitor websites and document best practices</p>', done: false },
  { title: 'Create wireframes', description_html: '<p>Design low-fidelity wireframes for all main pages</p>', done: false },
  { title: 'Setup development environment', description_html: '<p>Configure local dev environment with all necessary tools</p>', done: true },
  { title: 'Design database schema', description_html: '<p>Create ERD and define all tables and relationships</p>', done: false },
  { title: 'Implement authentication', description_html: '<p>Build user login, registration, and password reset flows</p>', done: false },
  { title: 'Create homepage layout', description_html: '<p>Develop responsive homepage with hero section and features</p>', done: false },
  { title: 'Write API documentation', description_html: '<p>Document all REST API endpoints with examples</p>', done: false },
  { title: 'Setup CI/CD pipeline', description_html: '<p>Configure automated testing and deployment pipeline</p>', done: true },
  { title: 'Conduct user testing', description_html: '<p>Run usability tests with 10 target users</p>', done: false },
  { title: 'Optimize performance', description_html: '<p>Improve page load times and reduce bundle size</p>', done: false }
];

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');

  const results = {
    users: [],
    projects: [],
    stages: [],
    tasks: []
  };

  try {
    // Step 1: Register users
    console.log('👥 Creating users...');
    for (const userData of USERS) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: true
          }
        }
      });

      if (signUpError) {
        // User might already exist, try to sign in
        console.log(`  ⚠️  User ${userData.email} might exist, attempting sign in...`);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (signInError) {
          console.error(`  ❌ Failed to auth ${userData.email}:`, signInError.message);
          continue;
        }

        console.log(`  ✓ Signed in as ${userData.email}`);
        results.users.push({
          email: userData.email,
          id: signInData.user.id,
          token: signInData.session.access_token
        });
      } else {
        console.log(`  ✓ Created user ${userData.email}`);
        results.users.push({
          email: userData.email,
          id: authData.user.id,
          token: authData.session.access_token
        });
      }
    }

    console.log(`\n✅ ${results.users.length} users ready\n`);

    // Step 2: Create projects for each user
    console.log('📁 Creating projects...');
    for (const user of results.users) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      });

      for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
        const projectData = {
          ...PROJECT_TEMPLATES[i],
          title: `${PROJECT_TEMPLATES[i].title} - ${user.email.split('@')[0]}`,
          project: `${PROJECT_TEMPLATES[i].project}-${user.email.split('@')[0].toUpperCase()}`,
          owner_user_id: user.id
        };

        const { data: project, error: projectError } = await supabaseAuth
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (projectError) {
          console.error(`  ❌ Failed to create project for ${user.email}:`, projectError.message);
          continue;
        }

        console.log(`  ✓ Created "${project.title}"`);
        results.projects.push({
          ...project,
          userId: user.id,
          userToken: user.token
        });
      }
    }

    console.log(`\n✅ ${results.projects.length} projects created\n`);

    // Step 3: Create stages for each project
    console.log('📊 Creating project stages...');
    for (const project of results.projects) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${project.userToken}`
          }
        }
      });

      for (const stageTemplate of STAGES) {
        const { data: stage, error: stageError } = await supabaseAuth
          .from('project_stages')
          .insert({
            project_id: project.id,
            title: stageTemplate.title,
            position: stageTemplate.position
          })
          .select()
          .single();

        if (stageError) {
          console.error(`  ❌ Failed to create stage for project ${project.title}:`, stageError.message);
          continue;
        }

        results.stages.push({
          ...stage,
          projectId: project.id,
          userToken: project.userToken
        });
      }
    }

    console.log(`✅ ${results.stages.length} stages created\n`);

    // Step 4: Create tasks for each project
    console.log('✏️  Creating tasks...');
    for (const project of results.projects) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${project.userToken}`
          }
        }
      });

      // Get stages for this project
      const projectStages = results.stages.filter(s => s.projectId === project.id);
      
      // Distribute 10 tasks across stages: 3 in Not Started, 4 in In Progress, 3 in Done
      const stageDistribution = [3, 4, 3];

      let taskIndex = 0;
      for (let stageIdx = 0; stageIdx < projectStages.length; stageIdx++) {
        const stage = projectStages[stageIdx];
        const taskCount = stageDistribution[stageIdx];

        for (let i = 0; i < taskCount; i++) {
          const taskTemplate = TASK_TEMPLATES[taskIndex % TASK_TEMPLATES.length];
          
          const { data: task, error: taskError } = await supabaseAuth
            .from('tasks')
            .insert({
              project_id: project.id,
              stage_id: stage.id,
              title: taskTemplate.title,
              description_html: taskTemplate.description_html,
              order_position: i,
              done: stage.title === 'Done' ? true : taskTemplate.done
            })
            .select()
            .single();

          if (taskError) {
            console.error(`  ❌ Failed to create task:`, taskError.message);
            continue;
          }

          results.tasks.push(task);
          taskIndex++;
        }
      }

      console.log(`  ✓ Created 10 tasks for "${project.title}"`);
    }

    console.log(`\n✅ ${results.tasks.length} tasks created\n`);

    // Summary
    console.log('🎉 Seed completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Users: ${results.users.length}`);
    console.log(`  - Projects: ${results.projects.length}`);
    console.log(`  - Stages: ${results.stages.length}`);
    console.log(`  - Tasks: ${results.tasks.length}`);
    console.log('\nTest credentials (all passwords: password123):');
    USERS.forEach(u => console.log(`  - ${u.email}`));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed().catch(console.error);
