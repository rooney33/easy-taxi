// 시범운영용 간단 인증: 운영자 페이지가 이 키를 헤더에 실어 보낸다.
// OPERATOR_KEY 환경변수가 설정되지 않으면 운영자 기능은 전부 잠긴다 (기본 키 없음).
const OPERATOR_KEY = process.env.OPERATOR_KEY;

export function isOperator(request: Request): boolean {
  if (!OPERATOR_KEY) return false;
  return request.headers.get("x-operator-key") === OPERATOR_KEY;
}
