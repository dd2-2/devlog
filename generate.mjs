// 개발일지 데이터 생성 스크립트
// STATUS.md/README.md/메모리 파일에서 "## YYYY-MM-DD ..." 형식 날짜 헤딩을 추출해 data.json으로 정리한다.
// 사용법: node generate.mjs  (source 폴더 안에서 실행)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = "H:/000_AI/project";
const MEMORY_ROOT = "C:/Users/engus/.claude/projects/h--000-AI-project/memory";

// id, 표시 이름, 상태(active/paused/archived), 한줄 설명, 문서 경로
const MANIFEST = [
  { id: "bidos", name: "BID OS", status: "active", desc: "교육콘텐츠 제작/입찰 업무 전체를 관리하는 업무 OS (일정·사업분석·제안서·자료관리)", file: `${PROJECT_ROOT}/bidos/source/STATUS.md` },
  { id: "autopdf", name: "autoPDF", status: "active", desc: "HWP/DOCX/PPTX → PDF 변환 + 병합/잠금해제/도장 도구", file: `${PROJECT_ROOT}/autopdf/source/STATUS.md` },
  { id: "docbox", name: "DocBox", status: "active", desc: "입찰 서류 복사·관리 앱 (멀티탭/그룹/자동매칭)", file: `${PROJECT_ROOT}/docbox/source/STATUS.md` },
  { id: "refhub", name: "RefHub", status: "active", desc: "로컬 이미지 레퍼런스 관리 앱 (태그/필터/PDF 내보내기)", file: `${PROJECT_ROOT}/refhub/source/STATUS.md` },
  { id: "textbox", name: "Textbox", status: "active", desc: "전역 단축키로 다른 프로그램에 텍스트를 자동 입력하는 앱", file: `${PROJECT_ROOT}/textbox/source/README.md` },
  { id: "bidmachine", name: "BidMachine", status: "paused", desc: "21라인 입찰공고 수집 + AI 구조화 + 구글시트 자동 등록 (개발 보류 중)", file: `${PROJECT_ROOT}/bidmachine/source/STATUS.md` },
  { id: "board1", name: "board1", status: "active", desc: "강의 대본 TXT를 PPT 슬라이드 노트에 자동 입력하는 도구 (데스크톱+웹)", file: `${MEMORY_ROOT}/project_board1.md` },
  { id: "gsheets_rfp_dashboard", name: "구글시트 RFP 대시보드", status: "paused", desc: "팀 공유용 RFP 현황 구글시트 대시보드 (Apps Script, 작업 중단)", file: `${MEMORY_ROOT}/project_gsheets_rfp_dashboard.md` },
  { id: "kto", name: "KTO", status: "active", desc: "관광e배움터 강좌 카탈로그 정적 사이트", file: `${PROJECT_ROOT}/KTO/source/README.md` },
  { id: "removetxt", name: "remove txt", status: "active", desc: "Ctrl+Shift+V로 서식 없이 붙여넣기 하는 상주 앱", file: `${PROJECT_ROOT}/removetxt/source/STATUS.md` },
  { id: "doglog", name: "doglog", status: "active", desc: "반려동물 관리수첩 안드로이드 앱 (앱 이름 petlog)", file: `${PROJECT_ROOT}/doglog/source/STATUS.md` },
  { id: "addppt", name: "add ppt", status: "active", desc: "PowerPoint 보조 기능 모음 (독립 exe + 리본 COM 애드인)", file: `${PROJECT_ROOT}/addppt/source/STATUS.md` },
  { id: "loggs", name: "loggs", status: "active", desc: "시스템 리소스 로거 + 시작프로그램 제외 일괄종료 도구", file: `${MEMORY_ROOT}/project_loggs.md` },
  { id: "nuggi", name: "nuggi", status: "active", desc: "Photoshop용 AI 자동 누끼(배경제거) 플러그인", file: `${PROJECT_ROOT}/nuggi/README.md` },
  { id: "swit_autofill", name: "SWIT 실적증명서 자동입력", status: "active", desc: "SWIT 실적증명서 등록을 자동화하는 Playwright+GUI 도구", file: `${PROJECT_ROOT}/swit_autofill/STATUS.md` },
  { id: "21mail", name: "21mail", status: "active", desc: "21라인 신규 관심공고를 이메일로 알려주는 Apps Script", file: `${PROJECT_ROOT}/21mail/STATUS.md` },
  { id: "bidfilter", name: "bidfilter", status: "archived", desc: "PDF 입찰공고 정보 추출 앱 (폐기됨)", file: `${MEMORY_ROOT}/project_bid_filter.md` },
  { id: "snapbox", name: "snapbox", status: "archived", desc: "Snipping Tool 대체 스크린샷 앱 (폐기됨)", file: `${MEMORY_ROOT}/project_snapbox.md` },
  { id: "liveabt", name: "LiveABT", status: "archived", desc: "데스크톱 아바타 오버레이 앱 (폐기됨)", file: `${MEMORY_ROOT}/project_liveabt.md` },
  { id: "liveabt_obs", name: "liveabt-obs", status: "archived", desc: "OBS용 Live2D 오버레이 플러그인 (폐기됨)", file: `${MEMORY_ROOT}/project_liveabt_obs.md` },
  { id: "rfp_radar_review", name: "RFP Radar 검토", status: "archived", desc: "외부 제공 RFP Radar 소스 검토 (개발 안 하기로 결정)", file: `${MEMORY_ROOT}/project_rfp_radar_review.md` },
];

// 공개 사이트에 올리면 안 되는 실 URL(구글시트/웹훅 등) 마스킹
function scrub(text) {
  return text
    .replace(/https:\/\/docs\.google\.com\/spreadsheets\/\S+/g, "(구글시트 링크 비공개)")
    .replace(/https:\/\/script\.google\.com\/macros\/\S+/g, "(웹훅 URL 비공개)");
}

const HEADING = /^(#{2,3})\s+(.*)$/;
const DATE_RE = /\d{4}-\d{2}-\d{2}/;

function stripFrontmatter(raw) {
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) return { body: raw.slice(end + 4), frontmatter: raw.slice(0, end) };
  }
  return { body: raw, frontmatter: "" };
}

// "## 2026-08-06: 제목" 처럼 날짜가 맨 앞이든, "## 제목 (2026-08-06)" 처럼 뒤에 있든
// 헤딩 한 줄에서 날짜 하나를 뽑아내고 나머지를 제목으로 정리한다.
function extractDateFromHeading(text) {
  const leading = text.match(/^(\d{4}-\d{2}-\d{2})\s*[:：\-–]?\s*(.*)$/);
  if (leading) return { date: leading[1], title: leading[2].trim() };

  const m = text.match(DATE_RE);
  if (!m) return null;
  let title = (text.slice(0, m.index) + text.slice(m.index + m[0].length))
    .replace(/\(\s*[,，]?\s*\)/g, "")
    .replace(/[,，]\s*\)/g, ")")
    .replace(/\(\s*[,，]\s*/g, "(")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { date: m[0], title: title || "업데이트" };
}

function frontmatterDate(frontmatter) {
  const m = frontmatter.match(/modified:\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function h1Date(body) {
  const firstLine = body.split("\n").find((l) => l.trim().length > 0) || "";
  const m = firstLine.match(DATE_RE);
  return m ? m[0] : null;
}

function parseEntries(projectId, raw, frontmatter, fileMtime) {
  const lines = raw.split("\n");
  const entries = [];
  let current = null;
  let preamble = [];

  for (const line of lines) {
    const h = line.match(HEADING);
    const parsed = h ? extractDateFromHeading(h[2].trim()) : null;
    if (parsed) {
      if (current) entries.push(current);
      current = { date: parsed.date, title: parsed.title || "업데이트", body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) entries.push(current);

  // 날짜 헤딩이 하나도 없는 문서(현황 요약형) — 통짜 스냅샷 1건으로 대체
  if (!entries.length) {
    const date = h1Date(raw) || frontmatterDate(frontmatter) || fileMtime;
    entries.push({ date, title: "현재 상태 (날짜별 기록 없음)", body: [raw] });
  }

  return entries.map((e, i) => ({
    id: `${projectId}-${e.date}-${i}`,
    date: e.date,
    title: e.title,
    bodyMd: scrub(e.body.join("\n").trim()),
  }));
}

const projects = [];
const entries = [];

for (const m of MANIFEST) {
  if (!fs.existsSync(m.file)) {
    console.warn(`[skip] 파일 없음: ${m.file}`);
    continue;
  }
  const fileRaw = fs.readFileSync(m.file, "utf-8");
  const { body: raw, frontmatter } = stripFrontmatter(fileRaw);
  const fileMtime = fs.statSync(m.file).mtime.toISOString().slice(0, 10);
  const rawMd = scrub(raw.trim());
  const projEntries = parseEntries(m.id, raw, frontmatter, fileMtime);
  const lastDate = projEntries.length ? projEntries.map((e) => e.date).sort().at(-1) : null;

  projects.push({
    id: m.id,
    name: m.name,
    status: m.status,
    desc: m.desc || "",
    entryCount: projEntries.length,
    lastDate,
    rawMd,
  });

  for (const e of projEntries) {
    entries.push({ ...e, projectId: m.id, projectName: m.name, status: m.status });
  }
}

entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const data = {
  generatedAt: new Date().toISOString(),
  projects,
  entries,
};

fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data), "utf-8");
console.log(`생성 완료: 프로젝트 ${projects.length}개, 타임라인 항목 ${entries.length}개`);
