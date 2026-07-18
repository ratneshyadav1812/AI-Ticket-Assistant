export const normalizeSkill = (skill) =>
  String(skill ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const normalizeSkills = (skills = []) =>
  [...new Set(skills.map(normalizeSkill).filter(Boolean))];

