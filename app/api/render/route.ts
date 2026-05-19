import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { supabase } from "@/lib/supabase";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { id, title, script, imageUrl } = body;

    // 만약 id가 비어있다면 자동 임시 ID 부여하여 빌드 방해 방지
    if (!id) {
      id = `gen_${Date.now()}`;
    }

    if (!title || !script) {
      return NextResponse.json(
        { error: "제목(title) 및 대본(script) 필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 1. 임시 파일 디렉토리 정의
    const projectRoot = process.cwd();
    const tempDir = path.join(projectRoot, "output");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 2. 파이썬 입력을 위한 JSON 임시 파일 작성
    const scriptJsonPath = path.join(tempDir, `script_${id}.json`);
    const outputVideoPath = path.join(tempDir, `video_${id}.mp4`);

    const scriptData = { id, title, script, imageUrl };
    fs.writeFileSync(scriptJsonPath, JSON.stringify(scriptData, null, 2), "utf-8");

    // 3. 파이썬 스크립트 실행
    const pythonScriptPath = path.join(projectRoot, "python", "render.py");
    console.log(`🎬 파이썬 영상 합성 구동 시작: ${id}`);
    
    // Windows의 python 또는 python3 호출 대응
    let pythonCmd = "python";
    try {
      await execAsync("python --version");
    } catch {
      pythonCmd = "python3";
    }

    const runCommand = `"${pythonCmd}" "${pythonScriptPath}" "${scriptJsonPath}" "${outputVideoPath}"`;
    
    let renderError = "";
    try {
      const { stderr, stdout } = await execAsync(runCommand);
      console.log("파이썬 stdout:", stdout);
      if (stderr) {
        console.warn("파이썬 실행 stderr:", stderr);
        renderError = stderr;
      }
    } catch (cmdErr: any) {
      console.error("파이썬 프로세스 비정상 종료:", cmdErr);
      renderError = cmdErr.stderr || cmdErr.message;
    }

    if (!fs.existsSync(outputVideoPath)) {
      throw new Error(`영상 합성 엔진 실행 실패 상세: ${renderError || "알 수 없는 파이썬 처리 지연"}`);
    }

    // 4. 로컬 public 폴더 복사 및 서비스 준비 (스토리지 실패 대비 선제 조치)
    const publicVideosDir = path.join(projectRoot, "public", "videos");
    if (!fs.existsSync(publicVideosDir)) {
      fs.mkdirSync(publicVideosDir, { recursive: true });
    }
    const publicVideoPath = path.join(publicVideosDir, `${id}.mp4`);
    fs.copyFileSync(outputVideoPath, publicVideoPath);
    
    // 로컬 기본 주소 매핑
    let videoPublicUrl = `/videos/${id}.mp4`;

    // 5. Supabase Storage 비디오 버킷에 합성 완료된 쇼츠 동영상 업로드 시도
    console.log(`☁️ Supabase Storage 업로드 중: video_${id}.mp4`);
    const fileBuffer = fs.readFileSync(outputVideoPath);
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(`${id}.mp4`, fileBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.warn("⚠️ Supabase Storage 업로드 건너뜀 (로컬 Fallback 가동):", uploadError.message);
      } else {
        // 업로드 성공 시에만 클라우드 URL로 대체
        videoPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${id}.mp4`;
      }
    } catch (storageErr: any) {
      console.warn("⚠️ Supabase 스토리지 API 연동 경고:", storageErr.message || storageErr);
    }

    // 6. 생성 이력(generations) 테이블 데이터베이스 상태 업데이트
    try {
      const { error: dbError } = await supabase
        .from("generations")
        .update({
          status: "rendered",
          video_path: videoPublicUrl,
        })
        .eq("id", id);

      if (dbError) {
        console.error("데이터베이스 상태 업데이트 오류:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("DB 업데이트 건너뜀:", dbErr);
    }

    // 7. 로컬 임시 연산 파일 소거
    try {
      fs.unlinkSync(scriptJsonPath);
      fs.unlinkSync(outputVideoPath);
    } catch (cleanupErr) {
      console.warn("임시 파일 청소 오류:", cleanupErr);
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoPublicUrl,
      message: "성공적으로 쇼츠 영상 합성이 완료되었습니다.",
    });
  } catch (error: any) {
    console.error("영상 합성 API 최상위 실패:", error);
    return NextResponse.json(
      { error: error.message || "영상 합성에 실패했습니다." },
      { status: 500 }
    );
  }
}
