import simpleGit from "simple-git";

const git = simpleGit();

// CONFIG
const CUTOFF_DATE = "2017-03-15";

const run = async () => {
  console.log("🚀 Removing commits before March 15, 2017...");

  // Get commits ON or AFTER the cutoff
  const logs = await git.log({
    "--since": CUTOFF_DATE
  });

  if (!logs.all.length) {
    throw new Error("❌ No commits found on/after March 15, 2017");
  }

  // Oldest commit that should remain
  const firstKeepCommit = logs.all[logs.all.length - 1];

  console.log("✅ First commit to keep:");
  console.log(`🔹 Hash: ${firstKeepCommit.hash}`);
  console.log(`📅 Date: ${firstKeepCommit.date}`);

  // Create orphan branch (fresh history)
  await git.checkout(["--orphan", "clean-branch"]);

  // Reset files to that commit state
  await git.raw(["reset", "--hard", firstKeepCommit.hash]);

  // Create new root commit
  await git.add(".");
  await git.commit(`History ${CUTOFF_DATE}`);

  // Rename branch to main
  try {
    await git.branch(["-D", "main"]);
  } catch (e) {
    console.log("ℹ️ main branch already removed or doesn't exist");
  }

  await git.branch(["-m", "main"]);

  console.log("🚀 Force pushing cleaned history...");
  await git.push("origin", "main", ["--force"]);

  console.log("🎉 Done! March 14 and earlier commits are gone.");
};

run().catch(console.error);