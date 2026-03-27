---
name: commit
description: 현재 변경사항을 분석하여 Porcana 앱 컨벤션에 맞는 커밋을 생성합니다. 커밋, git commit, 변경사항 저장 시 사용.
disable-model-invocation: true
argument-hint: "[커밋 메시지 (선택)]"
allowed-tools: Read, Bash, Grep, Glob
---

# Commit

현재 변경사항을 파악하여 Porcana 앱 컨벤션에 맞는 커밋을 생성합니다.

사용자 메시지: $ARGUMENTS

## 커밋 메시지 규칙

프로젝트는 다음 형식을 사용합니다:

```
<Type> : <내용> (한글)
```

| Type     | 용도                          |
|----------|-------------------------------|
| Feat     | 새로운 기능 추가              |
| Fix      | 버그 수정                     |
| Style    | UI/스타일 변경 (로직 무관)    |
| Refactor | 코드 리팩토링                 |
| Chore    | 빌드, 설정, 패키지 등 잡무    |
| Docs     | 문서 수정                     |
| Test     | 테스트 추가/수정              |
| Perf     | 성능 개선                     |
| Deploy   | 배포                          |

## 절차

1. `git status`로 변경 파일 목록 확인
2. `git diff` (staged + unstaged)로 변경 내용 파악
3. `git log --oneline -5`로 최근 커밋 스타일 확인
4. 변경 사항을 분석해 적절한 Type과 한글 메시지 제안
5. 사용자 확인 후 커밋 실행

## 주의사항

- `.env`, 시크릿 파일은 절대 커밋하지 않습니다.
- 빈 커밋은 생성하지 않습니다.
- force push, amend는 사용자가 명시적으로 요청한 경우에만 수행합니다.
- pre-commit 훅 실패 시 수정 후 새 커밋을 생성합니다 (--amend 금지).
- 커밋 메시지는 HEREDOC으로 전달합니다.
