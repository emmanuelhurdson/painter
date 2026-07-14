import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const path = "./data.json";

// Configuration - change these values to customize your commits!
const CONFIG = {
  year: 2019,             // Target year for commits (e.g., 2023, 2022, etc.)
  totalCommits: 1,       // Total number of commits to make
  intensity: "medium",      // Options: "low", "medium", "high", "extreme"
  workDaysOnly: false,      // If true, only commit on weekdays (Mon-Fri)
  maxCommitsPerDay: 14       // 0 = auto-calculated based on intensity, or set specific number
};

// Calculate max commits per day based on intensity
const getMaxCommitsPerDay = () => {
  if (CONFIG.maxCommitsPerDay > 0) return CONFIG.maxCommitsPerDay;
  
  switch(CONFIG.intensity) {
    case "low":
      return 3;     // Light activity
    case "medium":
      return 8;     // Moderate activity
    case "high":
      return 15;    // Heavy activity
    case "extreme":
      return 30;    // Very intense - will make the graph very dark green
    default:
      return 8;
  }
};

// Check if date should be skipped based on configuration
const shouldSkipDate = (date) => {
  if (CONFIG.workDaysOnly) {
    const dayOfWeek = date.day(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  return false;
};

// Generate a random date within the target year
const generateRandomDate = () => {
  const startOfYear = moment().year(CONFIG.year).startOf('year');
  const endOfYear = moment().year(CONFIG.year).endOf('year');
  
  const randomDay = random.int(0, endOfYear.diff(startOfYear, 'days'));
  const date = moment(startOfYear).add(randomDay, 'days');
  
  return date;
};

// Generate a weighted random date (more commits on weekdays if desired)
const generateWeightedDate = () => {
  let date;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    date = generateRandomDate();
    attempts++;
    
    if (attempts > maxAttempts) {
      // If we can't find a non-skipped date, just use any date
      return generateRandomDate();
    }
  } while (shouldSkipDate(date));
  
  return date;
};

// Make multiple commits on the same day for intensity
const makeMultipleCommitsOnDay = async (date, commitsLeft) => {
  const maxPerDay = getMaxCommitsPerDay();
  const commitsToday = random.int(1, Math.min(maxPerDay, commitsLeft));
  
  console.log(`📅 Making ${commitsToday} commit(s) on ${date.format('YYYY-MM-DD')}`);
  
  for (let i = 0; i < commitsToday; i++) {
    const formattedDate = date.format();
    
    const data = {
      date: formattedDate,
      commitNumber: i + 1,
      totalToday: commitsToday
    };
    
    // Small delay to ensure commits are in order (optional)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await new Promise((resolve, reject) => {
      jsonfile.writeFile(path, data, (err) => {
        if (err) reject(err);
        
        simpleGit()
          .add([path])
          .commit(`${formattedDate} - commit ${i + 1}/${commitsToday}`, { "--date": formattedDate }, (commitErr) => {
            if (commitErr) reject(commitErr);
            console.log(`  ✅ Commit ${i + 1}/${commitsToday} complete`);
            resolve();
          });
      });
    });
  }
  
  return commitsToday;
};

// Main function to make all commits
const makeCommits = async () => {
  console.log("🚀 Starting commit generator...");
  console.log(`📊 Configuration:
  • Year: ${CONFIG.year}
  • Total Commits: ${CONFIG.totalCommits}
  • Intensity: ${CONFIG.intensity}
  • Max Commits/Day: ${getMaxCommitsPerDay()}
  • Work Days Only: ${CONFIG.workDaysOnly}
  `);
  
  let commitsRemaining = CONFIG.totalCommits;
  const usedDates = new Set();
  
  while (commitsRemaining > 0) {
    const date = generateWeightedDate();
    const dateKey = date.format('YYYY-MM-DD');
    
    // Avoid using the exact same date too many times (optional)
    if (usedDates.has(dateKey) && random.boolean()) {
      continue;
    }
    
    usedDates.add(dateKey);
    
    const commitsMade = await makeMultipleCommitsOnDay(date, commitsRemaining);
    commitsRemaining -= commitsMade;
    
    console.log(`📊 Progress: ${CONFIG.totalCommits - commitsRemaining}/${CONFIG.totalCommits} commits completed\n`);
    
    // Small delay between different days
    if (commitsRemaining > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log("✨ All commits completed! Pushing to remote...");
  await simpleGit().push();
  console.log("🎉 Done! Your GitHub graph should update soon.");
};

// Start the process
makeCommits().catch(console.error);
