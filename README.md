# 누리 다운로드 홈페이지 — nuri.sindoida.co.kr

## GitHub Pages로 올리기 (무료)
1. GitHub에서 새 저장소 `nuri-site`를 **Public**으로 만듭니다.
2. 이 폴더의 파일(index.html, privacy.html, CNAME, img 폴더)을 모두 올립니다.
3. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
4. 같은 화면 **Custom domain**에 `nuri.sindoida.co.kr` 입력 → Save

## Cloudflare DNS 연결
Cloudflare → sindoida.co.kr → **DNS → 레코드 추가**
| 유형 | 이름 | 대상 | 프록시 |
|---|---|---|---|
| CNAME | nuri | ksg30802480.github.io | **DNS 전용(회색 구름)** |

- 기존 `sindoida.co.kr`(NAS) 기록과 메일 기록은 건드리지 않습니다.
- 몇 분 뒤 GitHub Pages 화면에서 **Enforce HTTPS**를 체크합니다.

## Microsoft Store 출시 후
`index.html` 맨 아래 `const STORE_URL = "";` 에 스토어 주소를 넣으면 다운로드 버튼이 켜집니다.

## 스토어 제출 때 쓸 주소
- 개인정보처리방침: https://nuri.sindoida.co.kr/privacy.html
- 지원 웹사이트: https://nuri.sindoida.co.kr/#support
