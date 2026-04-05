import type { ChallengeDef } from "@/lib/module-routes";
import type { GitSimState } from "@/lib/git-emulator";

/** Initial simulator state that varies by challenge (remotes, etc.). */
export function getGitBootstrapForChallenge(
  challenge: ChallengeDef,
): {
  remotes?: NonNullable<GitSimState["remotes"]>;
  fileContents?: NonNullable<GitSimState["fileContents"]>;
  conflictFiles?: NonNullable<GitSimState["conflictFiles"]>;
  modifiedPaths?: string[];
} {
  switch (challenge.id) {
    case "CHAL102":
      return {
        remotes: {
          origin: {
            fetch: "https://github.com/you/my-fork.git",
            push: "https://github.com/you/my-fork.git",
          },
        },
      };
    case "CHAL304":
      return getMergeConflictBootstrap();
    default:
      return {};
  }
}

/** Merge conflict challenge: files with realistic conflict markers. */
function getMergeConflictBootstrap(): {
  fileContents: NonNullable<GitSimState["fileContents"]>;
  conflictFiles: NonNullable<GitSimState["conflictFiles"]>;
  modifiedPaths: string[];
} {
  const configJs = `// Application configuration
const config = {
<<<<<<< HEAD
  apiUrl: "https://api.staging.example.com",
  timeout: 5000,
  debug: true,
=======
  apiUrl: "https://api.production.example.com",
  timeout: 10000,
  debug: false,
>>>>>>> feature/deploy
  retries: 3,
};

module.exports = config;
`;

  const utilsJs = `// Utility functions
function formatDate(date) {
<<<<<<< HEAD
  return date.toLocaleDateString("en-US");
=======
  return date.toISOString().split("T")[0];
>>>>>>> feature/deploy
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = { formatDate, calculateTotal };
`;

  return {
    fileContents: {
      "config.js": configJs,
      "utils.js": utilsJs,
    },
    conflictFiles: ["config.js", "utils.js"],
    modifiedPaths: ["config.js", "utils.js"],
  };
}
