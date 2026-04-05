-- CHAL304: Interactive merge conflict resolution challenge for PROG6112 (Merge Conflict Resolution module)
INSERT INTO "challenges" ("id", "module_id", "slug", "title", "description", "difficulty", "xp", "sort_order", "objectives_json") VALUES
	('CHAL304', 'PROG6112', 'resolve-merge-conflicts', 'Resolve Merge Conflicts', 'A merge has left your repository with conflicting changes. Edit the files to remove all conflict markers, keeping the code you want, then stage and commit the resolved files.', 'MEDIUM', 450, 1, '[{"id":"obj1","text":"Resolve conflicts in config.js"},{"id":"obj2","text":"Resolve conflicts in utils.js"},{"id":"obj3","text":"Stage all resolved files"},{"id":"obj4","text":"Commit changes with message \"merge complete\""}]')
ON CONFLICT ("id") DO NOTHING;
