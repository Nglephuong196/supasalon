// Vietnamese provinces and centrally-governed cities (34 total)
// Updated after July 1, 2025 administrative reform

export const VIETNAM_PROVINCES = [
  // 6 Centrally-governed cities (Thành phố trực thuộc Trung ương)
  "Hà Nội",
  "Huế",
  "Đà Nẵng",
  "TP. Hồ Chí Minh",
  "Cần Thơ",
  "Hải Phòng",

  // 28 Provinces (Tỉnh)
  // Unchanged (11)
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
  "Lạng Sơn",
  "Quảng Ninh",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Cao Bằng",

  // Newly formed through mergers
  "Tuyên Quang", // Hà Giang + Tuyên Quang
  "Lào Cai", // Yên Bái + Lào Cai
  "Thái Nguyên", // Bắc Kạn + Thái Nguyên
  "Phú Thọ", // Vĩnh Phúc + Hòa Bình + Phú Thọ
  "Bắc Ninh", // Bắc Giang + Bắc Ninh
  "Hưng Yên", // Thái Bình + Hưng Yên
  "Ninh Bình", // Hà Nam + Nam Định + Ninh Bình
  "Quảng Trị", // Quảng Bình + Quảng Trị
  "Quảng Ngãi", // Kon Tum + Quảng Ngãi
  "Gia Lai", // Bình Định + Gia Lai
  "Khánh Hòa", // Ninh Thuận + Khánh Hòa
  "Lâm Đồng", // Đắk Nông + Bình Thuận + Lâm Đồng
  "Đắk Lắk", // Phú Yên + Đắk Lắk
  "Đồng Nai", // Bình Phước + Đồng Nai
  "Tây Ninh", // Long An + Tây Ninh
  "Vĩnh Long", // Bến Tre + Trà Vinh + Vĩnh Long
  "Đồng Tháp", // Tiền Giang + Đồng Tháp
  "Cà Mau", // Bạc Liêu + Cà Mau
  "An Giang", // Kiên Giang + An Giang
] as const;

export type VietnamProvince = (typeof VIETNAM_PROVINCES)[number];

// Vietnamese phone number regex
// Matches: 0xxxxxxxxx, +84xxxxxxxxx (10 digits after 0 or 9 after +84)
// Valid prefixes: 03, 05, 07, 08, 09 (mobile carriers)
export const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = phone.replace(/[\s\-\.]/g, "");
  return VIETNAM_PHONE_REGEX.test(normalized);
}
