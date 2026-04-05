-- Clearer PR workflow challenge copy: commit message is learner-chosen; validation unchanged.
UPDATE challenges
SET description = 'Practice the full pull request workflow: create a feature branch from main, stage your changes, commit with a message you choose, push, and set upstream tracking so the branch is ready for review.'
WHERE id = 'CHAL201';
