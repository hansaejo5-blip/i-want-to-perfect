# i-want-to-perfect

Vite + React 기반 프로젝트입니다. `main` 브랜치에 푸시하면 GitHub Pages로 자동 배포되도록 설정되어 있습니다.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages deployment

배포 대상 저장소:

`https://github.com/hansaejo5-blip/i-want-to-perfect`

설정된 내용:

- Vite `base` 경로를 `/i-want-to-perfect/`로 지정
- `.github/workflows/deploy.yml`에서 `main` 브랜치 푸시 시 자동 빌드/배포
- git remote `origin`을 해당 저장소로 연결

추가로 GitHub 저장소에서 한 번만 확인할 것:

1. `Settings > Pages > Source`가 `GitHub Actions`로 잡혀 있는지 확인
2. 로컬 변경사항을 커밋한 뒤 `origin/main`으로 푸시

배포 주소는 보통 아래 형식입니다.

`https://hansaejo5-blip.github.io/i-want-to-perfect/`
