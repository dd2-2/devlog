# 개발일지

여러 프로젝트의 STATUS.md / 메모리 파일에서 날짜별 기록(`## YYYY-MM-DD ...` 헤딩)을 모아
하나의 타임라인 사이트로 보여주는 정적 사이트. GitHub Pages로 배포되어 PC/모바일 어디서든 확인 가능.

- 배포 URL: https://dd2-2.github.io/devlog/
- 소스: `H:\000_AI\project\devlog\source\`

## 갱신 방법

각 프로젝트의 STATUS.md를 업데이트한 뒤, 이 폴더에서:

```
node generate.mjs
git add data.json
git commit -m "devlog: 데이터 갱신"
git push
```

`generate.mjs` 상단의 `MANIFEST` 배열이 어떤 프로젝트의 어떤 파일을 읽을지 정의함.
새 프로젝트가 생기면 이 배열에 `{ id, name, status, file }` 한 줄 추가.

## 주의

- `generate.mjs`의 `scrub()` 함수가 구글시트/웹훅 URL 등 실제 링크를 자동 마스킹함 —
  새로운 종류의 민감 정보(API 키, 실제 계정 등)가 STATUS.md에 들어가면 이 함수에 마스킹 규칙 추가할 것.
- public 저장소이므로 STATUS.md 작성 시 실제 비밀번호/키 값 자체를 적지 않도록 주의(지금까지는
  필드 이름만 언급하고 실제 값은 안 적혀 있음).
