// 개발일지 데이터 생성 스크립트
// STATUS.md/README.md/메모리 파일에서 "## YYYY-MM-DD ..." 형식 날짜 헤딩을 추출해 data.json으로 정리한다.
// 사용법: node generate.mjs  (source 폴더 안에서 실행)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = "H:/000_AI/project";
const MEMORY_ROOT = "C:/Users/engus/.claude/projects/h--000-AI-project/memory";

// id, 표시 이름, 상태(active/paused/archived), 문서 경로
const MANIFEST = [
  { id: "bidos", name: "BID OS", status: "active", file: `${PROJECT_ROOT}/bidos/source/STATUS.md` },
  { id: "autopdf", name: "autoPDF", status: "active", file: `${PROJECT_ROOT}/autopdf/source/STATUS.md` },
  { id: "docbox", name: "DocBox", status: "active", file: `${PROJECT_ROOT}/docbox/source/STATUS.md` },
  { id: "refhub", name: "RefHub", status: "active", file: `${PROJECT_ROOT}/refhub/source/STATUS.md` },
  { id: "textbox", name: "Textbox", status: "active", file: `${PROJECT_ROOT}/textbox/source/README.md` },
  { id: "bidmachine", name: "BidMachine", status: "paused", file: `${PROJECT_ROOT}/bidmachine/source/STATUS.md` },
  { id: "board1", name: "board1", status: "active", file: `${MEMORY_ROOT}/project_board1.md` },
  { id: "gsheets_rfp_dashboard", name: "구글시트 RFP 대시보드", status: "paused", file: `${MEMORY_ROOT}/project_gsheets_rfp_dashboard.md` },
  { id: "kto", name: "KTO", status: "active", file: `${PROJECT_ROOT}/KTO/source/README.md` },
  { id: "removetxt", name: "remove txt", status: "active", file: `${PROJECT_ROOT}/removetxt/source/STATUS.md` },
  { id: "doglog", name: "doglog", status: "active", file: `${PROJECT_ROOT}/doglog/source/STATUS.md` },
  { id: "addppt", name: "add ppt", status: "active", file: `${PROJECT_ROOT}/addppt/source/STATUS.md` },
  { id: "loggs", name: "loggs", status: "active", file: `${MEMORY_ROOT}/project_loggs.md` },
  { id: "nuggi", name: "nuggi", status: "active", file: `${PROJECT_ROOT}/nuggi/README.md` },
  { id: "swit_autofill", name: "SWIT 실적증명서 자동입력", status: "active", file: `${PROJECT_ROOT}/swit_autofill/STATUS.md` },
  { id: "21mail", name: "21mail", status: "active", file: `${PROJECT_ROOT}/21mail/STATUS.md` },
  { id: "bidfilter", name: "bidfilter", status: "archived", file: `${MEMORY_ROOT}/project_bid_filter.md` },
  { id: "snapbox", name: "snapbox", status: "archived", file: `${MEMORY_ROOT}/project_snapbox.md` },
  { id: "liveabt", name: "LiveABT", status: "archived", file: `${MEMORY_ROOT}/project_liveabt.md` },
  { id: "liveabt_obs", name: "liveabt-obs", status: "archived", file: `${MEMORY_ROOT}/project_liveabt_obs.md` },
  { id: "rfp_radar_review", name: "RFP Radar 검토", status: "archived", file: `${MEMORY_ROOT}/project_rfp_radar_review.md` },
];

// 공개 사이트에 올리면 안 되는 실 URL(구글시트/웹훅 등) 마스킹
function scrub(text) {
  return text
    .replace(/https:\/\/docs\.google\.com\/spreadsheets\/\S+/g, "(구글시트 링크 비공개)")
    .replace(/https:\/\/script\.google\.com\/macros\/\S+/g, "(웹훅 URL 비공개)");
}

const DATE_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})\s*[:：]?\s*(.*)$/;

function stripFrontmatter(raw) {
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) return raw.slice(end + 4);
  }
  return raw;
}

function parseEntries(projectId, raw) {
  const lines = raw.split("\n");
  const entries = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(DATE_HEADING);
    if (m) {
      if (current) entries.push(current);
      current = { date: m[1], title: m[2].trim() || "업데이트", body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) entries.push(current);
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
  const raw = stripFrontmatter(fs.readFileSync(m.file, "utf-8"));
  const rawMd = scrub(raw.trim());
  const projEntries = parseEntries(m.id, raw);
  const lastDate = projEntries.length ? projEntries.map((e) => e.date).sort().at(-1) : null;

  projects.push({
    id: m.id,
    name: m.name,
    status: m.status,
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
