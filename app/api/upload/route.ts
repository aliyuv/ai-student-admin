import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

// 允许的文件类型
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `最多上传 ${MAX_FILES} 个文件` }, { status: 400 })
    }

    // 按月份分目录
    const now = new Date()
    const subDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "appeals", subDir)
    await mkdir(uploadDir, { recursive: true })

    const results: { fileName: string; filePath: string; fileSize: number; fileType: string }[] = []

    for (const file of files) {
      // 类型校验
      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          { error: `不支持的文件类型: ${file.name}，仅支持图片、PDF、Word、Excel` },
          { status: 400 }
        )
      }

      // 大小校验
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `文件 ${file.name} 超过 5MB 限制` },
          { status: 400 }
        )
      }

      const ext = ALLOWED_TYPES[file.type]
      const uniqueName = `${crypto.randomUUID()}${ext}`
      const filePath = path.join(uploadDir, uniqueName)

      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buffer)

      results.push({
        fileName: file.name,
        filePath: `/uploads/appeals/${subDir}/${uniqueName}`,
        fileSize: file.size,
        fileType: file.type,
      })
    }

    return NextResponse.json({ files: results })
  } catch {
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 })
  }
}
