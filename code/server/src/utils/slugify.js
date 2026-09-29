/**
 * Convert Vietnamese string with accents to URL-friendly slug
 * Example: "Điện Thoại & Máy Tính Bảng" -> "dien-thoai-may-tinh-bang"
 */
export const slugify = (text) => {
  if (!text) return '';

  let slug = text.toString().toLowerCase().trim();

  // Normalize and replace Vietnamese characters
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[đĐ]/g, 'd') // replace special d
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start
    .replace(/-+$/, ''); // trim - from end

  return slug;
};
