/**
 * refactorSchema.js
 *
 * Automatically refactors your code to match Supabase schema.
 * Replacements:
 *   id           -> id
 *   password_hash      -> password_hash
 *   ssu_users     -> users
 *   created_at     -> created_at
 *   updated_at     -> updated_at
 *   is_admin       -> is_admin
 *   folder_id      -> folder_id
 *
 * NOTE: This script modifies files in place. Backup your project first!
 */

const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, ''); // root of your project
const extensions = ['.ts', '.tsx', '.js', '.jsx']; // files to scan

const replacements = [
  { from: /\b_ssu_users\b/g, to: 'users' },
  { from: /\b_id\b/g, to: 'id' },
  { from: /\bpassword\b/g, to: 'password_hash' },
  { from: /\bcreatedAt\b/g, to: 'created_at' },
  { from: /\bupdatedAt\b/g, to: 'updated_at' },
  { from: /\bisAdmin\b/g, to: 'is_admin' },
  { from: /\bfolderId\b/g, to: 'folder_id' },
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (extensions.includes(path.extname(file))) {
      results.push(filePath);
    }
  });
  return results;
}

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${filePath}`);
  }
}

const files = walkDir(projectDir);
files.forEach(refactorFile);

console.log('✅ Refactor complete. Make sure to test your project!');
