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
    const { id, title, script, imageUrl } = body;

    if (!id || !title || !script) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      )
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
    
    const { stderr } = await execAsync(runCommand);
    if (stderr && stderr.includes("Error")) {
      console.error("파이썬 실행 경고/오류:", stderr);
    }

    if (!fs.existsSync(outputVideoPath)) {
      throw new Error("영상 합성 처리가 비정상적으로 완료되었거나 출력 비디오 파일이 누락되었습니다.");
    }

    // 4. Supabase Storage 비디오 버킷에 합성 완료된 쇼츠 동영상 업로드
    console.log(`☁️ Supabase Storage 업로드 중: video_${id}.mp4`);
    const fileBuffer = fs.readFileSync(outputVideoPath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .upload(`${id}.mp4`, fileBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
    }

    // 5. 생성 이력(generations) 테이블 데이터베이스 상태 업데이트
    const videoPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${id}.mp4`;
    
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

    // 6. 로컬 임시 파일 소거
    try {
      fs.unlinkSync(scriptJsonPath);
      fs.unlinkSync(outputVideoPath);
    } catch (cleanupErr) {
      console.warn("임시 파일 청소 오류:", cleanupErr);
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoPublicUrl,
      message: "성공적으로 쇼츠 영상 합성 및 스토리지가 업로드되었습니다.",
    });
  } catch (error: any) {
    console.error("영상 합성 API 최상위 실패:", error);
    return NextResponse.json(
      { error: error.message || "영상 합성에 실패했습니다." },
      { status: 500 }
    );
  }
}
