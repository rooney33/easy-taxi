// 시범운영용 간단 인증: 운영자 페이지가 이 키를 헤더에 실어 보낸다.
// 실제 배포 시 .env에 OPERATOR_KEY를 반드시 설정할 것.
const OPERATOR_KEY = process.env.OPERATOR_KEY ?? "family-taxi-pilot";

export function isOperator(request: Request): boolean {
  return request.headers.get("x-operator-key") === OPERATOR_KEY;
}
