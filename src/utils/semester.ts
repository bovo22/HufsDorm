export function getCurrentSemester(): string {
  const now = new Date();
  const half = now.getMonth() + 1 >= 8 ? 2 : 1;
  return `${now.getFullYear()}-${half}`;
}

export function getSemesterEndDate(semester: string): Date {
  const [year, half] = semester.split('-');
  // 1학기: 8월 31일, 2학기: 12월 31일
  return half === '1'
    ? new Date(`${year}-08-31T23:59:59`)
    : new Date(`${year}-12-31T23:59:59`);
}

export function isSemesterActive(verifiedUntil: string): boolean {
  if (!verifiedUntil) return false;
  return new Date(verifiedUntil) > new Date();
}
