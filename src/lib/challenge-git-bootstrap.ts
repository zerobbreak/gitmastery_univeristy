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
  recoverLostCommitScenario?: boolean;
  interactiveRebaseDrill?: boolean;
  rerereMergeLab?: boolean;
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
    /** PR workflow expects `git push -u origin <branch>` like a clone with GitHub as origin. */
    case "CHAL201":
      return {
        remotes: {
          origin: {
            fetch: "https://github.com/you/project.git",
            push: "https://github.com/you/project.git",
          },
        },
      };
    case "CHAL202":
      return { recoverLostCommitScenario: true };
    case "CHAL304":
      return getMergeConflictBootstrap();
    case "CHAL401":
      return { interactiveRebaseDrill: true };
    case "CHAL402":
      return { rerereMergeLab: true };
    case "CHAL405":
      return {
        fileContents: {
          "README.md":
            "# Project\n\nAPI_KEY=sk_live_bad_do_not_commit\n\nDocs here.\n",
        },
        modifiedPaths: ["README.md"],
      };
    case "CHAL407":
      return {
        remotes: {
          origin: {
            fetch: "https://github.com/you/oss-fork.git",
            push: "https://github.com/you/oss-fork.git",
          },
        },
        fileContents: {
          "CONTRIBUTING.md": "# Contributing\n\nAdd your notes below.\n",
        },
        modifiedPaths: ["CONTRIBUTING.md"],
      };
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
