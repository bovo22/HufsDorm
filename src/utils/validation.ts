const HUFS_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@hufs\.ac\.kr$/;
// 대문자 + 소문자 + 숫자 또는 특수문자 포함, 8자 이상
const STRONG_PW_REGEX  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*()_\-+=]).{8,}$/;
// 닉네임: 한글/영문/숫자 2~12자, 공백 불가
const NICKNAME_REGEX   = /^[가-힣a-zA-Z0-9]{2,12}$/;

export function isHufsEmail(email: string): boolean {
  return HUFS_EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return STRONG_PW_REGEX.test(password);
}

export function passwordStrengthMessage(): string {
  return '대문자·소문자·숫자/특수문자 포함 8자 이상';
}

export function isValidNickname(nickname: string): boolean {
  return NICKNAME_REGEX.test(nickname.trim());
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
