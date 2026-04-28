export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Firebase auth 에러 코드를 사용자 메시지로 변환
export function toAuthMessage(code: string): string {
  const map: Record<string, string> = {
    // Firebase 10+: user-not-found + wrong-password → invalid-credential (보안상 통합)
    'auth/invalid-credential':   '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/user-not-found':       '등록되지 않은 이메일입니다.',
    'auth/wrong-password':       '비밀번호가 올바르지 않습니다.',
    'auth/invalid-email':        '이메일 형식이 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password':        '비밀번호는 6자 이상이어야 합니다.',
    'auth/too-many-requests':    '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'auth/user-disabled':        '비활성화된 계정입니다. 관리자에게 문의해주세요.',
    'auth/network-request-failed': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  };
  return map[code] ?? `오류가 발생했습니다. (${code})`;
}
