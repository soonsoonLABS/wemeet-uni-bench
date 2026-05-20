"""
We-Meet Benchmark Server

로컬 개발 서버 및 결과를 로컬 파일(DB)로 저장하는 API 지원 서버.
의존성 없이 표준 파이썬 라이브러리만 사용합니다.

사용법:
    python scripts/server.py
"""

import http.server
import json
import os
import sys
from pathlib import Path

PORT = 8000

# 경로 설정
PROJECT_ROOT = Path(__file__).parent.parent
WEBSITE_DIR = PROJECT_ROOT / "website"
RESULTS_DIR = PROJECT_ROOT / "benchmarks" / "results"

class BenchmarkHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # website 디렉토리를 루트로 설정하여 정적 파일 서빙
        super().__init__(*args, directory=str(WEBSITE_DIR), **kwargs)

    def do_OPTIONS(self):
        """CORS Preflight 대응"""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        # 1. API: 결과 목록 조회
        if self.path == "/api/results":
            self.handle_get_results()
            return
        
        # 2. API: 특정 결과 파일 상세 데이터 조회
        elif self.path.startswith("/api/results/"):
            self.handle_get_result_file()
            return

        # 3. 기본 정적 파일 서빙
        super().do_GET()

    def do_POST(self):
        # CORS 헤더 등을 위한 preflight는 OPTIONS에서 잡음
        if self.path == "/api/save_result":
            self.handle_save_result()
            return
        
        self.send_error(404, "API endpoint not found")

    def handle_get_results(self):
        """저장된 벤치마크 결과 목록 및 요약 정보 반환"""
        if not RESULTS_DIR.exists():
            self._send_json([])
            return

        results = []
        for file in RESULTS_DIR.glob("*.json"):
            # .gitkeep 무시
            if file.name.startswith("."):
                continue
            
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                # 결과 요약 정보 파싱
                results.append({
                    "filename": file.name,
                    "run_id": data.get("run_id", file.stem.replace("run_", "")),
                    "timestamp": data.get("timestamp", ""),
                    "problem_id": data.get("problem_id", ""),
                    "prompt": data.get("prompt", "")[:100],  # 100자 잘라내어 요약 제공
                    "model_count": len(data.get("results", []))
                })
            except Exception as e:
                # 파싱 실패한 파일 건너뜀
                print(f"[WARN] Failed to parse result file {file.name}: {e}")
                continue

        # 최근 실행 시간 순으로 정렬
        results.sort(key=lambda x: x["timestamp"], reverse=True)
        self._send_json(results)

    def handle_get_result_file(self):
        """특정 결과 파일의 전체 내용 반환"""
        filename = self.path.replace("/api/results/", "")
        
        # 상위 디렉토리 참조 공격 방지
        filename = os.path.basename(filename)
        file_path = RESULTS_DIR / filename

        if not file_path.exists() or not file_path.is_file():
            self.send_error(404, "Result file not found")
            return

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(data)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def handle_save_result(self):
        """클라이언트가 보내온 벤치마크 실행 결과를 파일로 저장"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))
            
            # 파일명 생성
            run_id = data.get("run_id", "unknown")
            # 디렉토리 생성 보장
            RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            
            file_path = RESULTS_DIR / f"run_{run_id}.json"
            
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            print(f"[INFO] 벤치마크 결과 저장 완료: {file_path.name}")
            self._send_json({"ok": True})
            
        except Exception as e:
            print(f"[ERROR] 결과 저장 실패: {e}")
            self._send_json({"ok": False, "error": str(e)}, status=500)


def main():
    # RESULTS_DIR 생성 보장
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("[SERVER] We-Meet Benchmark Local Server Starting...")
    print(f"   Root Website : {WEBSITE_DIR}")
    print(f"   Database Path: {RESULTS_DIR}")
    print(f"   Listening on : http://localhost:{PORT}")
    print("=" * 60)

    # 포트 사용 중 충돌 방지 설정 적용하여 서버 인스턴스 생성
    class ThreadingHTTPServer(http.server.ThreadingHTTPServer):
        allow_reuse_address = True

    try:
        with ThreadingHTTPServer(("", PORT), BenchmarkHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] 서버를 종료합니다.")
        sys.exit(0)


if __name__ == "__main__":
    main()
